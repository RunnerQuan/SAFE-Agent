#!/usr/bin/env ruby
# frozen_string_literal: true

# Google Tasks Manager Script
#
# Purpose: Manage Google Tasks with full CRUD operations on task lists and tasks
# Usage: See --help for detailed command examples
# Output: JSON with results or error information
# Exit codes: 0=success, 1=operation failed, 2=auth error, 3=api error, 4=invalid args

require 'optparse'
require 'json'
require 'fileutils'
require 'time'
require 'google/apis/tasks_v1'
require 'google/apis/drive_v3'
require 'google/apis/calendar_v3'
require 'google/apis/people_v1'
require 'googleauth'
require 'googleauth/stores/file_token_store'

# Script version
VERSION = '1.0.0'

# Configuration constants - shared with all Google skills
TASKS_SCOPE = Google::Apis::TasksV1::AUTH_TASKS
DRIVE_SCOPE = Google::Apis::DriveV3::AUTH_DRIVE
CALENDAR_SCOPE = Google::Apis::CalendarV3::AUTH_CALENDAR
CONTACTS_SCOPE = Google::Apis::PeopleV1::AUTH_CONTACTS
GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.modify'

CREDENTIALS_PATH = File.join(Dir.home, '.claude', '.google', 'client_secret.json')
TOKEN_PATH = File.join(Dir.home, '.claude', '.google', 'token.json')
OOB_URI = 'urn:ietf:wg:oauth:2.0:oob'

# Exit codes
EXIT_SUCCESS = 0
EXIT_OPERATION_FAILED = 1
EXIT_AUTH_ERROR = 2
EXIT_API_ERROR = 3
EXIT_INVALID_ARGS = 4

# Output JSON result
def output_json(data)
  puts JSON.pretty_generate(data)
end

# Authorize with Google OAuth 2.0 (ALL scopes for shared token)
def authorize
  unless File.exist?(CREDENTIALS_PATH)
    return {
      status: 'error',
      code: 'AUTH_ERROR',
      message: "Credentials file not found at #{CREDENTIALS_PATH}"
    }
  end

  begin
    client_id = Google::Auth::ClientId.from_file(CREDENTIALS_PATH)
  rescue => e
    return {
      status: 'error',
      code: 'AUTH_ERROR',
      message: "Failed to load credentials: #{e.message}"
    }
  end

  # Create token store with ALL scopes (shared with calendar, drive, etc.)
  token_store = Google::Auth::Stores::FileTokenStore.new(file: TOKEN_PATH)
  authorizer = Google::Auth::UserAuthorizer.new(
    client_id,
    [TASKS_SCOPE, DRIVE_SCOPE, CALENDAR_SCOPE, CONTACTS_SCOPE, GMAIL_SCOPE],
    token_store
  )

  user_id = 'default'
  credentials = authorizer.get_credentials(user_id)

  # If no valid credentials, prompt for authorization
  if credentials.nil?
    url = authorizer.get_authorization_url(base_url: OOB_URI)

    puts "Open the following URL in your browser and authorize the application:"
    puts url
    puts "\nEnter the authorization code:"

    code = gets.chomp

    begin
      credentials = authorizer.get_and_store_credentials_from_code(
        user_id: user_id,
        code: code,
        base_url: OOB_URI
      )
    rescue => e
      return {
        status: 'error',
        code: 'AUTH_ERROR',
        message: "Authorization failed: #{e.message}"
      }
    end
  end

  # Automatically refresh token if expired
  begin
    credentials.refresh! if credentials.expired?
  rescue => e
    return {
      status: 'error',
      code: 'AUTH_ERROR',
      message: "Token refresh failed: #{e.message}"
    }
  end

  credentials
end

# Initialize Tasks API service
def init_service(credentials)
  service = Google::Apis::TasksV1::TasksService.new
  service.client_options.application_name = 'Claude Tasks Skill'
  service.authorization = credentials
  service
end

# ============================================================================
# TASK LIST OPERATIONS
# ============================================================================

# List all task lists
def list_task_lists(options, service)
  begin
    response = service.list_tasklists(
      max_results: options[:max_results] || 100
    )

    lists = (response.items || []).map do |list|
      {
        id: list.id,
        title: list.title,
        updated: list.updated,
        self_link: list.self_link
      }
    end

    {
      status: 'success',
      operation: 'list_tasklists',
      count: lists.length,
      task_lists: lists
    }
  rescue Google::Apis::Error => e
    {
      status: 'error',
      code: 'API_ERROR',
      message: "Failed to list task lists: #{e.message}"
    }
  end
end

# Get a specific task list
def get_task_list(options, service)
  list_id = options[:list_id] || '@default'

  begin
    list = service.get_tasklist(list_id)

    {
      status: 'success',
      operation: 'get_tasklist',
      task_list: {
        id: list.id,
        title: list.title,
        updated: list.updated,
        self_link: list.self_link
      }
    }
  rescue Google::Apis::Error => e
    {
      status: 'error',
      code: 'API_ERROR',
      message: "Failed to get task list: #{e.message}"
    }
  end
end

# Create a new task list
def create_task_list(options, service)
  unless options[:title]
    return {
      status: 'error',
      code: 'INVALID_ARGS',
      message: 'Task list title is required (--title)'
    }
  end

  begin
    task_list = Google::Apis::TasksV1::TaskList.new(
      title: options[:title]
    )

    result = service.insert_tasklist(task_list)

    {
      status: 'success',
      operation: 'create_tasklist',
      task_list: {
        id: result.id,
        title: result.title,
        updated: result.updated,
        self_link: result.self_link
      }
    }
  rescue Google::Apis::Error => e
    {
      status: 'error',
      code: 'API_ERROR',
      message: "Failed to create task list: #{e.message}"
    }
  end
end

# Update a task list
def update_task_list(options, service)
  list_id = options[:list_id]

  unless list_id
    return {
      status: 'error',
      code: 'INVALID_ARGS',
      message: 'Task list ID is required (--list-id)'
    }
  end

  begin
    # Get existing list first
    existing = service.get_tasklist(list_id)

    # Update fields
    existing.title = options[:title] if options[:title]

    result = service.update_tasklist(list_id, existing)

    {
      status: 'success',
      operation: 'update_tasklist',
      task_list: {
        id: result.id,
        title: result.title,
        updated: result.updated
      }
    }
  rescue Google::Apis::Error => e
    {
      status: 'error',
      code: 'API_ERROR',
      message: "Failed to update task list: #{e.message}"
    }
  end
end

# Delete a task list
def delete_task_list(options, service)
  list_id = options[:list_id]

  unless list_id
    return {
      status: 'error',
      code: 'INVALID_ARGS',
      message: 'Task list ID is required (--list-id)'
    }
  end

  begin
    service.delete_tasklist(list_id)

    {
      status: 'success',
      operation: 'delete_tasklist',
      list_id: list_id,
      message: 'Task list deleted successfully'
    }
  rescue Google::Apis::Error => e
    {
      status: 'error',
      code: 'API_ERROR',
      message: "Failed to delete task list: #{e.message}"
    }
  end
end

# ============================================================================
# TASK OPERATIONS
# ============================================================================

# List tasks in a task list
def list_tasks(options, service)
  list_id = options[:list_id] || '@default'

  begin
    params = {
      max_results: options[:max_results] || 100,
      show_completed: options[:show_completed].nil? ? true : options[:show_completed],
      show_hidden: options[:show_hidden] || false
    }

    # Filter by due date range if specified
    params[:due_min] = Time.parse(options[:due_min]).utc.iso8601 if options[:due_min]
    params[:due_max] = Time.parse(options[:due_max]).utc.iso8601 if options[:due_max]

    # Filter by completion date range if specified
    params[:completed_min] = Time.parse(options[:completed_min]).utc.iso8601 if options[:completed_min]
    params[:completed_max] = Time.parse(options[:completed_max]).utc.iso8601 if options[:completed_max]

    response = service.list_tasks(list_id, **params)

    tasks = (response.items || []).map do |task|
      format_task(task)
    end

    {
      status: 'success',
      operation: 'list_tasks',
      list_id: list_id,
      count: tasks.length,
      tasks: tasks
    }
  rescue Google::Apis::Error => e
    {
      status: 'error',
      code: 'API_ERROR',
      message: "Failed to list tasks: #{e.message}"
    }
  end
end

# Get a specific task
def get_task(options, service)
  list_id = options[:list_id] || '@default'
  task_id = options[:task_id]

  unless task_id
    return {
      status: 'error',
      code: 'INVALID_ARGS',
      message: 'Task ID is required (--task-id)'
    }
  end

  begin
    task = service.get_task(list_id, task_id)

    {
      status: 'success',
      operation: 'get_task',
      task: format_task(task)
    }
  rescue Google::Apis::Error => e
    {
      status: 'error',
      code: 'API_ERROR',
      message: "Failed to get task: #{e.message}"
    }
  end
end

# Create a new task
def create_task(options, service)
  list_id = options[:list_id] || '@default'

  unless options[:title]
    return {
      status: 'error',
      code: 'INVALID_ARGS',
      message: 'Task title is required (--title)'
    }
  end

  begin
    task = Google::Apis::TasksV1::Task.new(
      title: options[:title],
      notes: options[:notes],
      status: options[:status] || 'needsAction'
    )

    # Parse and set due date if provided
    if options[:due]
      begin
        due_time = Time.parse(options[:due])
        task.due = due_time.utc.iso8601
      rescue => e
        return {
          status: 'error',
          code: 'INVALID_TIME',
          message: "Failed to parse due date: #{e.message}"
        }
      end
    end

    # Insert with optional parent and previous sibling for ordering
    params = {}
    params[:parent] = options[:parent] if options[:parent]
    params[:previous] = options[:previous] if options[:previous]

    result = service.insert_task(list_id, task, **params)

    {
      status: 'success',
      operation: 'create_task',
      task: format_task(result)
    }
  rescue Google::Apis::Error => e
    {
      status: 'error',
      code: 'API_ERROR',
      message: "Failed to create task: #{e.message}"
    }
  end
end

# Update an existing task
def update_task(options, service)
  list_id = options[:list_id] || '@default'
  task_id = options[:task_id]

  unless task_id
    return {
      status: 'error',
      code: 'INVALID_ARGS',
      message: 'Task ID is required (--task-id)'
    }
  end

  begin
    # Get existing task first
    existing = service.get_task(list_id, task_id)

    # Update fields if provided
    existing.title = options[:title] if options[:title]
    existing.notes = options[:notes] if options[:notes]
    existing.status = options[:status] if options[:status]

    # Handle due date
    if options[:due]
      begin
        due_time = Time.parse(options[:due])
        existing.due = due_time.utc.iso8601
      rescue => e
        return {
          status: 'error',
          code: 'INVALID_TIME',
          message: "Failed to parse due date: #{e.message}"
        }
      end
    end

    # Clear due date if explicitly requested
    existing.due = nil if options[:clear_due]

    result = service.update_task(list_id, task_id, existing)

    {
      status: 'success',
      operation: 'update_task',
      task: format_task(result)
    }
  rescue Google::Apis::Error => e
    {
      status: 'error',
      code: 'API_ERROR',
      message: "Failed to update task: #{e.message}"
    }
  end
end

# Mark task as complete
def complete_task(options, service)
  list_id = options[:list_id] || '@default'
  task_id = options[:task_id]

  unless task_id
    return {
      status: 'error',
      code: 'INVALID_ARGS',
      message: 'Task ID is required (--task-id)'
    }
  end

  begin
    existing = service.get_task(list_id, task_id)
    existing.status = 'completed'

    result = service.update_task(list_id, task_id, existing)

    {
      status: 'success',
      operation: 'complete_task',
      task: format_task(result)
    }
  rescue Google::Apis::Error => e
    {
      status: 'error',
      code: 'API_ERROR',
      message: "Failed to complete task: #{e.message}"
    }
  end
end

# Mark task as incomplete (uncomplete)
def uncomplete_task(options, service)
  list_id = options[:list_id] || '@default'
  task_id = options[:task_id]

  unless task_id
    return {
      status: 'error',
      code: 'INVALID_ARGS',
      message: 'Task ID is required (--task-id)'
    }
  end

  begin
    existing = service.get_task(list_id, task_id)
    existing.status = 'needsAction'
    existing.completed = nil

    result = service.update_task(list_id, task_id, existing)

    {
      status: 'success',
      operation: 'uncomplete_task',
      task: format_task(result)
    }
  rescue Google::Apis::Error => e
    {
      status: 'error',
      code: 'API_ERROR',
      message: "Failed to uncomplete task: #{e.message}"
    }
  end
end

# Delete a task
def delete_task(options, service)
  list_id = options[:list_id] || '@default'
  task_id = options[:task_id]

  unless task_id
    return {
      status: 'error',
      code: 'INVALID_ARGS',
      message: 'Task ID is required (--task-id)'
    }
  end

  begin
    service.delete_task(list_id, task_id)

    {
      status: 'success',
      operation: 'delete_task',
      task_id: task_id,
      message: 'Task deleted successfully'
    }
  rescue Google::Apis::Error => e
    {
      status: 'error',
      code: 'API_ERROR',
      message: "Failed to delete task: #{e.message}"
    }
  end
end

# Move a task (change parent or position)
def move_task(options, service)
  list_id = options[:list_id] || '@default'
  task_id = options[:task_id]

  unless task_id
    return {
      status: 'error',
      code: 'INVALID_ARGS',
      message: 'Task ID is required (--task-id)'
    }
  end

  begin
    params = {}
    params[:parent] = options[:parent] if options[:parent]
    params[:previous] = options[:previous] if options[:previous]

    result = service.move_task(list_id, task_id, **params)

    {
      status: 'success',
      operation: 'move_task',
      task: format_task(result)
    }
  rescue Google::Apis::Error => e
    {
      status: 'error',
      code: 'API_ERROR',
      message: "Failed to move task: #{e.message}"
    }
  end
end

# Clear completed tasks from a list
def clear_completed(options, service)
  list_id = options[:list_id] || '@default'

  begin
    service.clear_tasks(list_id)

    {
      status: 'success',
      operation: 'clear_completed',
      list_id: list_id,
      message: 'All completed tasks cleared from list'
    }
  rescue Google::Apis::Error => e
    {
      status: 'error',
      code: 'API_ERROR',
      message: "Failed to clear completed tasks: #{e.message}"
    }
  end
end

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

# Format task object for output
def format_task(task)
  {
    id: task.id,
    title: task.title,
    notes: task.notes,
    status: task.status,
    due: task.due,
    completed: task.completed,
    parent: task.parent,
    position: task.position,
    updated: task.updated,
    self_link: task.self_link,
    is_completed: task.status == 'completed'
  }
end

# ============================================================================
# COMMAND LINE PARSING
# ============================================================================

def parse_arguments
  options = {}

  parser = OptionParser.new do |opts|
    opts.banner = "Usage: #{File.basename($0)} --operation <op> [options]"
    opts.separator ""
    opts.separator "Google Tasks Manager Script"
    opts.separator ""
    opts.separator "Task List Operations:"

    opts.on("--operation OP",
            [:list_tasklists, :get_tasklist, :create_tasklist, :update_tasklist, :delete_tasklist,
             :list_tasks, :get_task, :create_task, :update_task, :delete_task,
             :complete_task, :uncomplete_task, :move_task, :clear_completed],
            "Operation to perform") do |op|
      options[:operation] = op
    end

    opts.separator ""
    opts.separator "Task List Options:"

    opts.on("--list-id ID", "Task list ID (default: @default for primary list)") do |id|
      options[:list_id] = id
    end

    opts.separator ""
    opts.separator "Task Options:"

    opts.on("--task-id ID", "Task ID (for get/update/delete/complete/move)") do |id|
      options[:task_id] = id
    end

    opts.on("--title TEXT", "Task or task list title") do |text|
      options[:title] = text
    end

    opts.on("--notes TEXT", "Task notes/description") do |text|
      options[:notes] = text
    end

    opts.on("--due DATE", "Due date (ISO8601 or natural language)") do |date|
      options[:due] = date
    end

    opts.on("--clear-due", "Clear the due date") do
      options[:clear_due] = true
    end

    opts.on("--status STATUS", [:needsAction, :completed],
            "Task status: needsAction, completed") do |status|
      options[:status] = status.to_s
    end

    opts.on("--parent ID", "Parent task ID (for subtasks)") do |id|
      options[:parent] = id
    end

    opts.on("--previous ID", "Previous sibling task ID (for ordering)") do |id|
      options[:previous] = id
    end

    opts.separator ""
    opts.separator "Filter Options:"

    opts.on("--max-results N", Integer, "Max results (default: 100)") do |n|
      options[:max_results] = n
    end

    opts.on("--show-completed", "Show completed tasks (default: true)") do
      options[:show_completed] = true
    end

    opts.on("--hide-completed", "Hide completed tasks") do
      options[:show_completed] = false
    end

    opts.on("--show-hidden", "Show hidden tasks") do
      options[:show_hidden] = true
    end

    opts.on("--due-min DATE", "Filter by minimum due date") do |date|
      options[:due_min] = date
    end

    opts.on("--due-max DATE", "Filter by maximum due date") do |date|
      options[:due_max] = date
    end

    opts.on("--completed-min DATE", "Filter by minimum completion date") do |date|
      options[:completed_min] = date
    end

    opts.on("--completed-max DATE", "Filter by maximum completion date") do |date|
      options[:completed_max] = date
    end

    opts.separator ""
    opts.separator "Other Options:"

    opts.on("-h", "--help", "Show this help") do
      puts opts
      exit 0
    end

    opts.on("-v", "--version", "Show version") do
      puts "Google Tasks Manager - Version #{VERSION}"
      exit 0
    end
  end

  begin
    parser.parse!

    if options[:operation].nil?
      puts "Error: --operation is required"
      puts parser
      exit EXIT_INVALID_ARGS
    end

  rescue OptionParser::InvalidOption, OptionParser::MissingArgument => e
    puts "Error: #{e.message}"
    puts parser
    exit EXIT_INVALID_ARGS
  end

  options
end

# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __FILE__ == $0
  options = parse_arguments

  # Authorize
  credentials = authorize

  # Check for auth errors
  if credentials.is_a?(Hash) && credentials[:status] == 'error'
    output_json(credentials)
    exit EXIT_AUTH_ERROR
  end

  # Initialize service
  service = init_service(credentials)

  # Execute operation
  result = case options[:operation]
           # Task List operations
           when :list_tasklists
             list_task_lists(options, service)
           when :get_tasklist
             get_task_list(options, service)
           when :create_tasklist
             create_task_list(options, service)
           when :update_tasklist
             update_task_list(options, service)
           when :delete_tasklist
             delete_task_list(options, service)

           # Task operations
           when :list_tasks
             list_tasks(options, service)
           when :get_task
             get_task(options, service)
           when :create_task
             create_task(options, service)
           when :update_task
             update_task(options, service)
           when :delete_task
             delete_task(options, service)
           when :complete_task
             complete_task(options, service)
           when :uncomplete_task
             uncomplete_task(options, service)
           when :move_task
             move_task(options, service)
           when :clear_completed
             clear_completed(options, service)

           else
             {
               status: 'error',
               code: 'INVALID_OPERATION',
               message: "Unknown operation: #{options[:operation]}"
             }
           end

  # Output result
  output_json(result)

  # Exit with appropriate code
  case result[:status]
  when 'success'
    exit EXIT_SUCCESS
  when 'error'
    case result[:code]
    when 'AUTH_ERROR'
      exit EXIT_AUTH_ERROR
    when 'API_ERROR'
      exit EXIT_API_ERROR
    when 'INVALID_ARGS'
      exit EXIT_INVALID_ARGS
    else
      exit EXIT_OPERATION_FAILED
    end
  else
    exit EXIT_OPERATION_FAILED
  end
end

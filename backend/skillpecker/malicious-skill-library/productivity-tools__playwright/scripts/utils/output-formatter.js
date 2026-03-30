class OutputFormatter {
  static success(data) {
    console.log(JSON.stringify({
      success: true,
      data: data
    }, null, 2));
  }

  static error(message, details = null) {
    console.error(JSON.stringify({
      success: false,
      error: message,
      details: details
    }, null, 2));
    process.exit(1);
  }

  static snapshot(tree) {
    // Format accessibility tree with refs
    console.log(tree);
  }
}

module.exports = OutputFormatter;

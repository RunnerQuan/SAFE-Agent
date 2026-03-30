---
name: chartjs-graphs
description: >
  Chart.js integration patterns for creating interactive statistical graphs in Django templates.
  Covers HTML setup, data injection, and JavaScript chart rendering with datalabels plugin.
license: Apache-2.0
metadata:
  author: Carlos
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Creating Chart.js graphs in Django"
    - "Implementing statistical dashboards with charts"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

## Chart.js Setup

**CDN Includes (in template head):**

```html
{% block extra_css %}
<!-- Chart.js CDN -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<!-- Chart.js DataLabels Plugin (shows values on chart) -->
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>
{% endblock %}
```

## HTML Template Pattern

**Canvas element with data attributes:**

```html
<!-- Line Chart Example -->
<canvas id="surveysChart" data-timeline='{{ timeline_data_json|safe }}'></canvas>

<!-- Bar Chart Example -->
<canvas id="complaintsChart" data-complaints='{{ complaints_data_json|safe }}'></canvas>

<!-- Dynamic Chart from Loop -->
<canvas id="chart-{{ forloop.counter }}" 
        data-question="{{ question_text }}"
        data-type="{{ data.type }}"
        data-summary='{{ data.summary|safe }}'></canvas>
```

**Key Points:**
- Use `data-*` attributes to pass JSON from Django context
- Always use `|safe` filter for JSON data
- Unique `id` for each canvas (use `forloop.counter` in loops)

## JavaScript Chart Patterns

### 1. Line Chart (Time Series)

```javascript
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('surveysChart');
    if (!canvas) return;
    
    // Get data from HTML data attribute
    const timelineDataRaw = canvas.getAttribute('data-timeline');
    const timelineData = JSON.parse(timelineDataRaw);
    
    // Validate data
    if (!timelineData || !timelineData.dates || timelineData.dates.length === 0) {
        console.warn('No data available');
        return;
    }
    
    // Create chart
    new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: timelineData.dates,  // X-axis labels
            datasets: [{
                label: 'Survey Submissions',
                data: timelineData.counts,  // Y-axis values
                borderColor: 'rgba(52, 152, 219, 1)',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,  // Line curve (0=straight, 0.4=smooth)
                pointRadius: 5,
                pointBackgroundColor: 'rgba(52, 152, 219, 1)',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                datalabels: { display: false }  // Disable labels on line points
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
});
```

### 2. Horizontal Bar Chart

```javascript
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('complaintsChart');
    if (!canvas) return;
    
    const complaintsDataRaw = canvas.getAttribute('data-complaints');
    const complaintsData = JSON.parse(complaintsDataRaw);
    
    // Convert object to arrays
    const labels = Object.keys(complaintsData);    // ['Reason 1', 'Reason 2']
    const counts = Object.values(complaintsData);  // [5, 3]
    
    new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Complaints',
                data: counts,
                backgroundColor: 'rgba(231, 76, 60, 0.7)',
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 2,
                borderRadius: 6,
                maxBarThickness: 50,
            }]
        },
        options: {
            indexAxis: 'y',  // Horizontal bars
            responsive: true,
            plugins: {
                legend: { display: false },
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'end',
                    color: '#333',
                    font: { weight: 'bold', size: 12 },
                    formatter: (value) => value  // Show numeric value
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        },
        plugins: [ChartDataLabels]  // Enable datalabels plugin
    });
});
```

### 3. Pie Chart

```javascript
document.addEventListener('DOMContentLoaded', function() {
    // Register datalabels plugin globally
    if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    }
    
    const canvas = document.getElementById('pieChart');
    const summaryData = JSON.parse(canvas.dataset.summary);
    
    const labels = Object.keys(summaryData);
    const values = Object.values(summaryData);
    
    // Generate dynamic colors
    const colors = [
        'rgba(52, 152, 219, 0.7)',   // Blue
        'rgba(46, 204, 113, 0.7)',   // Green
        'rgba(241, 196, 15, 0.7)',   // Yellow
        'rgba(231, 76, 60, 0.7)',    // Red
        'rgba(155, 89, 182, 0.7)',   // Purple
    ];
    
    new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 15, font: { size: 12 } }
                },
                datalabels: {
                    color: '#ffffff',
                    formatter: (value, ctx) => {
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        const pct = (value / total) * 100;
                        return `${pct.toFixed(1)}%`;
                    },
                    font: { weight: '600', size: 11 }
                }
            }
        }
    });
});
```

### 4. Vertical Bar Chart

```javascript
new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
        labels: labels,
        datasets: [{
            label: 'Number of Responses',
            data: values,
            backgroundColor: 'rgba(52, 152, 219, 0.7)',
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { display: false },
            datalabels: {
                anchor: 'end',
                align: 'end',
                color: '#000',
                formatter: (value) => value
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1, precision: 0 }
            }
        }
    },
    plugins: [ChartDataLabels]
});
```

## Data Injection from Django

**In Django view (CBV):**

```python
import json
from django.views.generic import TemplateView

class DashboardView(TemplateView):
    template_name = "dashboard.html"
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Prepare data as dictionary
        timeline_data = {
            'dates': ['2024-01-01', '2024-01-02', '2024-01-03'],
            'counts': [5, 8, 12]
        }
        
        complaints_data = {
            'Bad Service': 10,
            'Late Arrival': 5,
            'Dirty Vehicle': 3
        }
        
        # Convert to JSON string
        context['timeline_data_json'] = json.dumps(timeline_data)
        context['complaints_data_json'] = json.dumps(complaints_data)
        
        return context
```

## Dynamic Color Palette

```javascript
const chartColors = {
    primary: '#3498db',
    success: '#2ecc71',
    warning: '#f39c12',
    danger: '#e74c3c',
    info: '#1abc9c',
    purple: '#9b59b6',
    pink: '#e91e63',
    orange: '#ff5722',
};

const colorPalette = Object.values(chartColors);

// Use in chart
backgroundColor: labels.map((_, i) => colorPalette[i % colorPalette.length])
```

## Best Practices

**ALWAYS:**
- ✅ Wrap code in `DOMContentLoaded` event listener
- ✅ Check if canvas exists before creating chart
- ✅ Validate parsed JSON data before using
- ✅ Use `try-catch` when parsing JSON
- ✅ Set `responsive: true` and `maintainAspectRatio: true`
- ✅ Use `beginAtZero: true` for bar/line charts
- ✅ Set `stepSize: 1` for integer-only data
- ✅ Register `ChartDataLabels` plugin when using datalabels
- ✅ Use `|safe` filter in Django template for JSON data

**NEVER:**
- ❌ Forget to check if canvas element exists
- ❌ Skip JSON parsing error handling
- ❌ Hard-code chart data in JavaScript (use Django context)
- ❌ Create charts without validating data first
- ❌ Forget to include Chart.js CDN in template

## File Structure

```
app/
├── templates/
│   └── app/
│       └── dashboard.html          # Canvas elements with data-* attributes
├── static/
│   └── app/
│       ├── js/
│       │   ├── line_chart.js       # One file per chart type
│       │   ├── bar_chart.js
│       │   └── pie_chart.js
│       └── css/
│           └── dashboard.css
└── views.py                        # JSON data preparation
```

## Common Issues

**Chart not rendering:**
1. Check if canvas ID matches JavaScript selector
2. Verify Chart.js CDN loaded before custom scripts
3. Check browser console for JavaScript errors
4. Validate JSON data structure

**DataLabels not showing:**
1. Include chartjs-plugin-datalabels CDN
2. Register plugin: `Chart.register(ChartDataLabels)`
3. Add plugin to chart config: `plugins: [ChartDataLabels]`
4. Set `datalabels: { display: true }` in options

**Data not updating:**
1. Clear browser cache
2. Check Django context data in view
3. Verify `|safe` filter used in template
4. Inspect canvas `data-*` attributes in browser DevTools

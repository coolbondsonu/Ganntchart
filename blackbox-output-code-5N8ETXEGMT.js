let chartData = [];

function generateChart() {
    try {
        hideError();
        const startDate = new Date(document.getElementById('startDate').value);
        const tasksInput = document.getElementById('tasksInput').value;
        chartData = JSON.parse(tasksInput);
        
        validateData(chartData, startDate);
        renderChart(startDate);
    } catch (error) {
        showError('Invalid JSON format. Please check your input.');
        console.error('Parse error:', error);
    }
}

function validateData(tasks, projectStart) {
    tasks.forEach((task, index) => {
        if (!task.name || !task.start || !task.duration) {
            throw new Error(`Task ${index + 1} is missing required fields (name, start, duration)`);
        }
        
        const taskStart = new Date(task.start);
        if (isNaN(taskStart.getTime())) {
            throw new Error(`Invalid start date for task "${task.name}": ${task.start}`);
        }
        
        if (task.duration <= 0 || !Number.isInteger(task.duration)) {
            throw new Error(`Invalid duration for task "${task.name}": ${task.duration}`);
        }
        
        task.startDate = taskStart;
        task.endDate = new Date(taskStart.getTime() + task.duration * 24 * 60 * 60 * 1000);
        task.color = task.color || getRandomColor();
        task.progress = Math.max(0, Math.min(100, task.progress || 0));
    });
}

function renderChart(projectStart) {
    const chart = document.getElementById('chart');
    chart.innerHTML = '';

    // Calculate date range
    const allDates = chartData.flatMap(task => {
        const dates = [];
        let current = new Date(task.startDate);
        while (current <= task.endDate) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    });

    if (allDates.length === 0) {
        showError('No valid dates found in tasks.');
        return;
    }

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
    const weekDays = Math.ceil(totalDays / 7);

    // Title
    const title = document.createElement('div');
    title.className = 'chart-title';
    title.textContent = 'Project Gantt Chart';
    chart.appendChild(title);

    // Date range
    const dateRange = document.createElement('div');
    dateRange.className = 'chart-date';
    dateRange.textContent = `Project Period: ${formatDate(minDate)} - ${formatDate(maxDate)}`;
    chart.appendChild(dateRange);

    // Header
    const header = document.createElement('div');
    header.className = 'chart-header';
    
    const taskHeader = document.createElement('div');
    taskHeader.className = 'date-header';
    taskHeader.textContent = 'Tasks';
    header.appendChild(taskHeader);
    
    const weekHeader = document.createElement('div');
    weekHeader.className = 'week-header';
    for (let i = 0; i < weekDays; i++) {
        const weekCell = document.createElement('div');
        weekCell.className = 'week-cell';
        weekCell.textContent = `Week ${i + 1}`;
        weekHeader.appendChild(weekCell);
    }
    header.appendChild(weekHeader);
    chart.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'chart-body';

    chartData.forEach(task => {
        const row = document.createElement('div');
        row.className = 'task-row';

        // Task name
        const nameCell = document.createElement('div');
        nameCell.className = 'task-name';
        nameCell.innerHTML = `<strong>${task.name}</strong><small>${task.duration} days</small>`;
        row.appendChild(nameCell);

        // Timeline
        const timeline = document.createElement('div');
        timeline.className = 'task-timeline';

        // Create timeline cells
        for (let i = 0; i < weekDays * 7; i++) {
            const cell = document.createElement('div');
            cell.className = 'timeline-cell';
            timeline.appendChild(cell);
        }

        const startOffset = Math.ceil((task.startDate - minDate) / (1000 * 60 * 60 * 24));
        const barWidth = task.duration * (100 / totalDays);

        const barContainer = document.createElement('div');
        barContainer.className = 'task-bar-container';
        barContainer.style.left = `${startOffset * (100 / totalDays)}%`;
        barContainer.style.width = `${task.duration * (100 / totalDays)}%`;

        const taskBar = document.createElement('div');
        taskBar.className = 'task-bar';
        taskBar.style.backgroundColor = task.color;
        taskBar.innerHTML = `${task.progress}%`;
        taskBar.title = `${task.name}: ${task.progress}% complete\nStart: ${formatDate(task.startDate)}\nEnd: ${formatDate(task.endDate)}`;

        const progressBar = document.createElement('div');
        progressBar.className = 'task-progress';
        progressBar.style.width = `${task.progress}%`;

        taskBar.appendChild(progressBar);
        barContainer.appendChild(taskBar);
        timeline.appendChild(barContainer);
        row.appendChild(timeline);

        body.appendChild(row);
    });

    chart.appendChild(body);

    // Today line
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOffset = Math.ceil((today - minDate) / (1000 * 60 * 60 * 24));
    if (todayOffset >= 0 && todayOffset < totalDays) {
        const todayLine = document.createElement('div');
        todayLine.className = 'today-line';
        todayLine.style.left = `${todayOffset * (100 / totalDays)}%`;
        todayLine.title = 'Today: ' + formatDate(today);
        chart.appendChild(todayLine);
    }
}

function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function getRandomColor() {
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    const errorDiv = document.getElementById('error');
    errorDiv.style.display = 'none';
}

function exportPNG() {
    const chart = document.getElementById('chart');
    html2canvas(chart, {
        backgroundColor: '#ffffff',
        scale: 2
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'gantt-chart.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(error => {
        showError('Failed to export PNG. Please try again.');
        console.error('Export error:', error);
    });
}

function downloadOneClick() {
    // First generate chart if not already generated
    if (chartData.length === 0) {
        try {
            generateChart();
        } catch (error) {
            showError('Please fix JSON errors before downloading.');
            return;
        }
    }
    
    // Show loading state
    const btn = document.querySelector('.btn-download');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
    btn.disabled = true;

    // Small delay to show loading state
    setTimeout(() => {
        exportPNG();
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 1000);
    }, 300);
}

function exportJSON() {
    try {
        const tasksInput = document.getElementById('tasksInput').value;
        const data = JSON.parse(tasksInput);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = 'gantt-tasks.json';
        link.href = URL.createObjectURL(blob);
        link.click();
    } catch (error) {
        showError('Failed to export JSON. Please check your input.');
    }
}

function exportExcel() {
    try {
        const startDate = new Date(document.getElementById('startDate').value);
        
        // Prepare data for Excel
        const excelData = chartData.map((task, index) => ({
            'Task #': index + 1,
            'Task Name': task.name,
            'Start Date': formatDate(task.startDate),
            'End Date': formatDate(task.endDate),
            'Duration (Days)': task.duration,
            'Progress (%)': task.progress,
            'Color Code': task.color,
            'Status': task.progress === 100 ? 'Completed' : 
                     task.progress >= 50 ? 'In Progress' : 
                     task.progress > 0 ? 'Started' : 'Not Started'
        }));

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        ws['!cols'] = [
            { wch: 8 },   // Task #
            { wch: 25 },  // Task Name
            { wch: 15 },  // Start Date
            { wch: 15 },  // End Date
            { wch: 18 },  // Duration
            { wch: 15 },  // Progress
            { wch: 12 },  // Color Code
            { wch: 15 }   // Status
        ];

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Gantt Chart Tasks');

        // Create summary sheet
        const summaryData = [
            { 'Summary': 'Project Gantt Chart Export' },
            { 'Summary': '' },
            { 'Summary': 'Total Tasks:', 'Value': chartData.length },
            { 'Summary': 'Project Start:', 'Value': formatDate(startDate) },
            { '
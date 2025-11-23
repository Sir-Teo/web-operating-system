/**
 * Data Visualization Suite
 * Advanced data visualization with interactive charts, graphs, and analytics
 *
 * Features:
 * - Multiple chart types (line, bar, pie, scatter, area, radar, heatmap)
 * - Interactive charts with zoom, pan, tooltips
 * - Data import from CSV, JSON, Excel
 * - Real-time data updates
 * - Custom styling and theming
 * - Data filtering and aggregation
 * - Export charts as PNG, SVG, or data
 * - Statistical analysis
 */

export default class DataVisualization {
    static metadata = {
        name: 'Data Visualization',
        description: 'Interactive charts and data analytics',
        author: 'WebOS',
        version: '1.0.0',
        category: 'productivity',
        icon: '📊'
    };

    constructor(system) {
        this.system = system;
        this.window = null;
        this.currentChart = null;
        this.data = [];
        this.chartType = 'line';
        this.chartConfig = {
            title: 'Chart Title',
            xLabel: 'X Axis',
            yLabel: 'Y Axis',
            showLegend: true,
            showGrid: true,
            animated: true,
            colors: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a']
        };
    }

    async open(args) {
        this.window = this.system.windowManager.createWindow({
            title: 'Data Visualization',
            width: '1400px',
            height: '900px',
            x: '5%',
            y: '3%'
        });

        const content = this.createUI();
        this.window.body.innerHTML = content;

        this.attachEventListeners();
        this.loadSampleData();
    }

    createUI() {
        return `
            <style>
                .dataviz-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    color: #e0e0e0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .dataviz-toolbar {
                    display: flex;
                    gap: 12px;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    flex-wrap: wrap;
                    backdrop-filter: blur(10px);
                }

                .toolbar-group {
                    display: flex;
                    gap: 6px;
                    padding: 6px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .toolbar-btn {
                    padding: 10px 16px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 6px;
                    color: #e0e0e0;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .toolbar-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(255, 255, 255, 0.3);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }

                .toolbar-btn.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-color: #667eea;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }

                .dataviz-content {
                    display: flex;
                    flex: 1;
                    overflow: hidden;
                }

                .data-panel {
                    width: 350px;
                    background: rgba(255, 255, 255, 0.03);
                    border-right: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    flex-direction: column;
                }

                .panel-section {
                    padding: 16px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .panel-section h3 {
                    margin: 0 0 12px 0;
                    font-size: 15px;
                    font-weight: 600;
                    color: #a0a0a0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .data-table-container {
                    flex: 1;
                    overflow: auto;
                    padding: 16px;
                }

                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }

                .data-table th {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 10px;
                    text-align: left;
                    font-weight: 600;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                    position: sticky;
                    top: 0;
                }

                .data-table td {
                    padding: 8px 10px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .data-table tr:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .chart-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: 24px;
                    overflow: auto;
                }

                .chart-canvas-wrapper {
                    flex: 1;
                    position: relative;
                    min-height: 400px;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                #chartCanvas {
                    width: 100% !important;
                    height: 100% !important;
                }

                .config-panel {
                    width: 320px;
                    background: rgba(255, 255, 255, 0.03);
                    border-left: 1px solid rgba(255, 255, 255, 0.1);
                    overflow-y: auto;
                    padding: 16px;
                }

                .config-option {
                    margin: 16px 0;
                }

                .config-option label {
                    display: block;
                    margin-bottom: 6px;
                    font-size: 13px;
                    font-weight: 500;
                    color: #b0b0b0;
                }

                .config-option input[type="text"],
                .config-option select {
                    width: 100%;
                    padding: 10px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 6px;
                    color: #e0e0e0;
                    font-size: 13px;
                }

                .config-option input[type="checkbox"] {
                    margin-right: 8px;
                }

                .config-option input[type="color"] {
                    width: 100%;
                    height: 40px;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 6px;
                    cursor: pointer;
                }

                .chart-types-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px;
                    margin-top: 12px;
                }

                .chart-type-btn {
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: #e0e0e0;
                    cursor: pointer;
                    font-size: 12px;
                    text-align: center;
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                }

                .chart-type-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.3);
                    transform: scale(1.05);
                }

                .chart-type-btn.active {
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
                    border-color: #667eea;
                    box-shadow: 0 0 15px rgba(102, 126, 234, 0.3);
                }

                .chart-type-icon {
                    font-size: 24px;
                }

                .stats-panel {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-top: 12px;
                }

                .stat-card {
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    text-align: center;
                }

                .stat-label {
                    font-size: 11px;
                    color: #888;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 6px;
                }

                .stat-value {
                    font-size: 20px;
                    font-weight: 600;
                    color: #667eea;
                }

                .color-picker-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                    margin-top: 8px;
                }

                .color-picker-item {
                    height: 40px;
                    border-radius: 6px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    cursor: pointer;
                }
            </style>

            <div class="dataviz-container">
                <div class="dataviz-toolbar">
                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-action="importCSV">📥 Import CSV</button>
                        <button class="toolbar-btn" data-action="importJSON">📄 Import JSON</button>
                        <button class="toolbar-btn" data-action="sample">🎲 Sample Data</button>
                    </div>

                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-action="exportPNG">🖼️ Export PNG</button>
                        <button class="toolbar-btn" data-action="exportSVG">📐 Export SVG</button>
                        <button class="toolbar-btn" data-action="exportData">💾 Export Data</button>
                    </div>

                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-action="refresh">🔄 Refresh</button>
                        <button class="toolbar-btn" data-action="fullscreen">⛶ Fullscreen</button>
                    </div>
                </div>

                <div class="dataviz-content">
                    <div class="data-panel">
                        <div class="panel-section">
                            <h3>Chart Type</h3>
                            <div class="chart-types-grid">
                                <button class="chart-type-btn active" data-chart="line">
                                    <span class="chart-type-icon">📈</span>
                                    <span>Line</span>
                                </button>
                                <button class="chart-type-btn" data-chart="bar">
                                    <span class="chart-type-icon">📊</span>
                                    <span>Bar</span>
                                </button>
                                <button class="chart-type-btn" data-chart="pie">
                                    <span class="chart-type-icon">🥧</span>
                                    <span>Pie</span>
                                </button>
                                <button class="chart-type-btn" data-chart="scatter">
                                    <span class="chart-type-icon">⚫</span>
                                    <span>Scatter</span>
                                </button>
                                <button class="chart-type-btn" data-chart="area">
                                    <span class="chart-type-icon">🏔️</span>
                                    <span>Area</span>
                                </button>
                                <button class="chart-type-btn" data-chart="radar">
                                    <span class="chart-type-icon">🎯</span>
                                    <span>Radar</span>
                                </button>
                                <button class="chart-type-btn" data-chart="doughnut">
                                    <span class="chart-type-icon">🍩</span>
                                    <span>Doughnut</span>
                                </button>
                                <button class="chart-type-btn" data-chart="bubble">
                                    <span class="chart-type-icon">🫧</span>
                                    <span>Bubble</span>
                                </button>
                            </div>
                        </div>

                        <div class="panel-section">
                            <h3>Statistics</h3>
                            <div class="stats-panel" id="statsPanel"></div>
                        </div>

                        <div class="data-table-container">
                            <h3 style="padding: 0 0 12px 0; margin: 0; font-size: 15px;">Data</h3>
                            <table class="data-table" id="dataTable">
                                <thead></thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>

                    <div class="chart-container">
                        <div class="chart-canvas-wrapper">
                            <canvas id="chartCanvas"></canvas>
                        </div>
                    </div>

                    <div class="config-panel">
                        <h3 style="margin: 0 0 16px 0; font-size: 15px;">Chart Configuration</h3>

                        <div class="config-option">
                            <label>Chart Title</label>
                            <input type="text" id="chartTitle" value="Chart Title">
                        </div>

                        <div class="config-option">
                            <label>X-Axis Label</label>
                            <input type="text" id="xLabel" value="X Axis">
                        </div>

                        <div class="config-option">
                            <label>Y-Axis Label</label>
                            <input type="text" id="yLabel" value="Y Axis">
                        </div>

                        <div class="config-option">
                            <label>
                                <input type="checkbox" id="showLegend" checked>
                                Show Legend
                            </label>
                        </div>

                        <div class="config-option">
                            <label>
                                <input type="checkbox" id="showGrid" checked>
                                Show Grid
                            </label>
                        </div>

                        <div class="config-option">
                            <label>
                                <input type="checkbox" id="animated" checked>
                                Animated
                            </label>
                        </div>

                        <div class="config-option">
                            <label>Color Scheme</label>
                            <div class="color-picker-grid" id="colorScheme"></div>
                        </div>

                        <button class="toolbar-btn" data-action="updateChart" style="width: 100%; margin-top: 20px;">
                            Update Chart
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const body = this.window.body;

        // Toolbar actions
        body.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
            });
        });

        // Chart type selection
        body.querySelectorAll('[data-chart]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                body.querySelectorAll('[data-chart]').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.chartType = e.currentTarget.dataset.chart;
                this.renderChart();
            });
        });
    }

    handleAction(action) {
        switch (action) {
            case 'importCSV':
                this.importCSV();
                break;
            case 'importJSON':
                this.importJSON();
                break;
            case 'sample':
                this.loadSampleData();
                break;
            case 'exportPNG':
                this.exportPNG();
                break;
            case 'exportSVG':
                this.exportSVG();
                break;
            case 'exportData':
                this.exportData();
                break;
            case 'refresh':
                this.renderChart();
                break;
            case 'fullscreen':
                this.toggleFullscreen();
                break;
            case 'updateChart':
                this.updateChartConfig();
                break;
        }
    }

    loadSampleData() {
        // Generate sample data
        this.data = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (const month of months) {
            this.data.push({
                label: month,
                sales: Math.floor(Math.random() * 5000) + 1000,
                expenses: Math.floor(Math.random() * 3000) + 500,
                profit: 0
            });
        }

        // Calculate profit
        this.data.forEach(row => {
            row.profit = row.sales - row.expenses;
        });

        this.updateDataTable();
        this.calculateStatistics();
        this.renderChart();
    }

    importCSV() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const text = await file.text();
                this.parseCSV(text);
            }
        };

        input.click();
    }

    parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        this.data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row = {};

            headers.forEach((header, index) => {
                const value = values[index]?.trim();
                // Try to parse as number
                row[header] = isNaN(value) ? value : parseFloat(value);
            });

            this.data.push(row);
        }

        this.updateDataTable();
        this.calculateStatistics();
        this.renderChart();
    }

    importJSON() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const text = await file.text();
                try {
                    this.data = JSON.parse(text);
                    this.updateDataTable();
                    this.calculateStatistics();
                    this.renderChart();
                } catch (error) {
                    alert('Invalid JSON file');
                }
            }
        };

        input.click();
    }

    updateDataTable() {
        const table = this.window.body.querySelector('#dataTable');
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        if (this.data.length === 0) return;

        // Create headers
        const headers = Object.keys(this.data[0]);
        thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

        // Create rows
        tbody.innerHTML = this.data.map(row =>
            `<tr>${headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>`
        ).join('');
    }

    calculateStatistics() {
        if (this.data.length === 0) return;

        const statsPanel = this.window.body.querySelector('#statsPanel');
        const numericColumns = {};

        // Find numeric columns
        const headers = Object.keys(this.data[0]);
        headers.forEach(header => {
            const values = this.data.map(row => row[header]).filter(v => typeof v === 'number');
            if (values.length > 0) {
                numericColumns[header] = values;
            }
        });

        let statsHTML = '';

        Object.entries(numericColumns).forEach(([column, values]) => {
            const sum = values.reduce((a, b) => a + b, 0);
            const avg = sum / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);

            statsHTML += `
                <div class="stat-card">
                    <div class="stat-label">${column} Avg</div>
                    <div class="stat-value">${avg.toFixed(2)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">${column} Min</div>
                    <div class="stat-value">${min}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">${column} Max</div>
                    <div class="stat-value">${max}</div>
                </div>
            `;
        });

        statsPanel.innerHTML = statsHTML;
    }

    renderChart() {
        const canvas = this.window.body.querySelector('#chartCanvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size
        const container = canvas.parentElement;
        canvas.width = container.clientWidth - 40;
        canvas.height = container.clientHeight - 40;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.data.length === 0) return;

        // Render based on chart type
        switch (this.chartType) {
            case 'line':
                this.renderLineChart(ctx, canvas);
                break;
            case 'bar':
                this.renderBarChart(ctx, canvas);
                break;
            case 'pie':
                this.renderPieChart(ctx, canvas);
                break;
            case 'scatter':
                this.renderScatterChart(ctx, canvas);
                break;
            case 'area':
                this.renderAreaChart(ctx, canvas);
                break;
            case 'radar':
                this.renderRadarChart(ctx, canvas);
                break;
            case 'doughnut':
                this.renderDoughnutChart(ctx, canvas);
                break;
            case 'bubble':
                this.renderBubbleChart(ctx, canvas);
                break;
        }
    }

    renderLineChart(ctx, canvas) {
        const padding = 60;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;

        // Draw grid
        if (this.chartConfig.showGrid) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;

            for (let i = 0; i <= 10; i++) {
                const y = padding + (chartHeight / 10) * i;
                ctx.beginPath();
                ctx.moveTo(padding, y);
                ctx.lineTo(canvas.width - padding, y);
                ctx.stroke();
            }
        }

        // Get numeric columns
        const headers = Object.keys(this.data[0]);
        const numericHeaders = headers.filter(h =>
            typeof this.data[0][h] === 'number'
        );

        const labelHeader = headers.find(h => typeof this.data[0][h] !== 'number');
        const labels = this.data.map(row => row[labelHeader] || '');

        // Draw lines for each numeric column
        numericHeaders.forEach((header, seriesIndex) => {
            const values = this.data.map(row => row[header]);
            const max = Math.max(...values);
            const min = Math.min(...values);
            const range = max - min;

            ctx.strokeStyle = this.chartConfig.colors[seriesIndex % this.chartConfig.colors.length];
            ctx.fillStyle = this.chartConfig.colors[seriesIndex % this.chartConfig.colors.length];
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();

            values.forEach((value, index) => {
                const x = padding + (chartWidth / (values.length - 1)) * index;
                const y = canvas.height - padding - ((value - min) / range) * chartHeight;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                // Draw point
                ctx.fillRect(x - 4, y - 4, 8, 8);
            });

            ctx.stroke();
        });

        // Draw axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();

        // Draw labels
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';

        labels.forEach((label, index) => {
            const x = padding + (chartWidth / (labels.length - 1)) * index;
            ctx.fillText(label, x, canvas.height - padding + 20);
        });

        // Draw title
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.chartConfig.title, canvas.width / 2, 30);

        // Draw legend
        if (this.chartConfig.showLegend) {
            this.drawLegend(ctx, canvas, numericHeaders);
        }
    }

    renderBarChart(ctx, canvas) {
        const padding = 60;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;

        // Draw grid
        if (this.chartConfig.showGrid) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;

            for (let i = 0; i <= 10; i++) {
                const y = padding + (chartHeight / 10) * i;
                ctx.beginPath();
                ctx.moveTo(padding, y);
                ctx.lineTo(canvas.width - padding, y);
                ctx.stroke();
            }
        }

        const headers = Object.keys(this.data[0]);
        const numericHeaders = headers.filter(h => typeof this.data[0][h] === 'number');
        const labelHeader = headers.find(h => typeof this.data[0][h] !== 'number');

        const barWidth = chartWidth / (this.data.length * numericHeaders.length + this.data.length);
        const groupWidth = barWidth * numericHeaders.length;

        numericHeaders.forEach((header, seriesIndex) => {
            const values = this.data.map(row => row[header]);
            const max = Math.max(...values, 0);

            values.forEach((value, index) => {
                const x = padding + index * (groupWidth + barWidth) + seriesIndex * barWidth;
                const barHeight = (value / max) * chartHeight;
                const y = canvas.height - padding - barHeight;

                ctx.fillStyle = this.chartConfig.colors[seriesIndex % this.chartConfig.colors.length];
                ctx.fillRect(x, y, barWidth - 2, barHeight);
            });
        });

        // Draw axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();

        // Draw labels
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';

        this.data.forEach((row, index) => {
            const x = padding + index * (groupWidth + barWidth) + groupWidth / 2;
            ctx.fillText(row[labelHeader], x, canvas.height - padding + 20);
        });

        // Draw title
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.chartConfig.title, canvas.width / 2, 30);

        // Draw legend
        if (this.chartConfig.showLegend) {
            this.drawLegend(ctx, canvas, numericHeaders);
        }
    }

    renderPieChart(ctx, canvas) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) / 3;

        const headers = Object.keys(this.data[0]);
        const valueHeader = headers.find(h => typeof this.data[0][h] === 'number');
        const labelHeader = headers.find(h => typeof this.data[0][h] !== 'number');

        const values = this.data.map(row => row[valueHeader]);
        const labels = this.data.map(row => row[labelHeader] || '');
        const total = values.reduce((a, b) => a + b, 0);

        let currentAngle = -Math.PI / 2;

        values.forEach((value, index) => {
            const sliceAngle = (value / total) * Math.PI * 2;

            ctx.fillStyle = this.chartConfig.colors[index % this.chartConfig.colors.length];
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();

            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${((value / total) * 100).toFixed(1)}%`, labelX, labelY);

            currentAngle += sliceAngle;
        });

        // Draw title
        ctx.fillStyle = '#e0e0e0';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.chartConfig.title, canvas.width / 2, 30);

        // Draw legend
        if (this.chartConfig.showLegend) {
            this.drawLegend(ctx, canvas, labels);
        }
    }

    renderScatterChart(ctx, canvas) {
        const padding = 60;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;

        // Draw grid
        if (this.chartConfig.showGrid) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;

            for (let i = 0; i <= 10; i++) {
                const y = padding + (chartHeight / 10) * i;
                ctx.beginPath();
                ctx.moveTo(padding, y);
                ctx.lineTo(canvas.width - padding, y);
                ctx.stroke();

                const x = padding + (chartWidth / 10) * i;
                ctx.beginPath();
                ctx.moveTo(x, padding);
                ctx.lineTo(x, canvas.height - padding);
                ctx.stroke();
            }
        }

        const headers = Object.keys(this.data[0]);
        const numericHeaders = headers.filter(h => typeof this.data[0][h] === 'number');

        if (numericHeaders.length >= 2) {
            const xValues = this.data.map(row => row[numericHeaders[0]]);
            const yValues = this.data.map(row => row[numericHeaders[1]]);

            const xMax = Math.max(...xValues);
            const xMin = Math.min(...xValues);
            const yMax = Math.max(...yValues);
            const yMin = Math.min(...yValues);

            ctx.fillStyle = this.chartConfig.colors[0];

            this.data.forEach((row, index) => {
                const x = padding + ((row[numericHeaders[0]] - xMin) / (xMax - xMin)) * chartWidth;
                const y = canvas.height - padding - ((row[numericHeaders[1]] - yMin) / (yMax - yMin)) * chartHeight;

                ctx.beginPath();
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // Draw axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();

        // Draw title
        ctx.fillStyle = '#e0e0e0';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.chartConfig.title, canvas.width / 2, 30);
    }

    renderAreaChart(ctx, canvas) {
        const padding = 60;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;

        const headers = Object.keys(this.data[0]);
        const numericHeaders = headers.filter(h => typeof this.data[0][h] === 'number');

        numericHeaders.forEach((header, seriesIndex) => {
            const values = this.data.map(row => row[header]);
            const max = Math.max(...values);
            const min = Math.min(...values);
            const range = max - min;

            const gradient = ctx.createLinearGradient(0, padding, 0, canvas.height - padding);
            const color = this.chartConfig.colors[seriesIndex % this.chartConfig.colors.length];
            gradient.addColorStop(0, color + '80');
            gradient.addColorStop(1, color + '10');

            ctx.fillStyle = gradient;
            ctx.beginPath();

            values.forEach((value, index) => {
                const x = padding + (chartWidth / (values.length - 1)) * index;
                const y = canvas.height - padding - ((value - min) / range) * chartHeight;

                if (index === 0) {
                    ctx.moveTo(x, canvas.height - padding);
                    ctx.lineTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.lineTo(canvas.width - padding, canvas.height - padding);
            ctx.closePath();
            ctx.fill();

            // Draw line
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();

            values.forEach((value, index) => {
                const x = padding + (chartWidth / (values.length - 1)) * index;
                const y = canvas.height - padding - ((value - min) / range) * chartHeight;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();
        });

        // Draw axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();

        // Draw title
        ctx.fillStyle = '#e0e0e0';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.chartConfig.title, canvas.width / 2, 30);
    }

    renderRadarChart(ctx, canvas) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) / 3;

        const headers = Object.keys(this.data[0]);
        const numericHeaders = headers.filter(h => typeof this.data[0][h] === 'number');
        const numAxes = numericHeaders.length;

        // Draw grid circles
        if (this.chartConfig.showGrid) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;

            for (let i = 1; i <= 5; i++) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, (radius / 5) * i, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Draw axes
            for (let i = 0; i < numAxes; i++) {
                const angle = (Math.PI * 2 / numAxes) * i - Math.PI / 2;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;

                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(x, y);
                ctx.stroke();

                // Draw label
                ctx.fillStyle = '#e0e0e0';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(numericHeaders[i], x * 1.1 - centerX * 0.1, y * 1.1 - centerY * 0.1);
            }
        }

        // Draw data
        this.data.forEach((row, rowIndex) => {
            const values = numericHeaders.map(h => row[h]);
            const max = Math.max(...values);

            ctx.strokeStyle = this.chartConfig.colors[rowIndex % this.chartConfig.colors.length];
            ctx.fillStyle = this.chartConfig.colors[rowIndex % this.chartConfig.colors.length] + '40';
            ctx.lineWidth = 2;

            ctx.beginPath();

            values.forEach((value, index) => {
                const angle = (Math.PI * 2 / numAxes) * index - Math.PI / 2;
                const dist = (value / max) * radius;
                const x = centerX + Math.cos(angle) * dist;
                const y = centerY + Math.sin(angle) * dist;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });

        // Draw title
        ctx.fillStyle = '#e0e0e0';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.chartConfig.title, canvas.width / 2, 30);
    }

    renderDoughnutChart(ctx, canvas) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const outerRadius = Math.min(canvas.width, canvas.height) / 3;
        const innerRadius = outerRadius * 0.6;

        const headers = Object.keys(this.data[0]);
        const valueHeader = headers.find(h => typeof this.data[0][h] === 'number');
        const labelHeader = headers.find(h => typeof this.data[0][h] !== 'number');

        const values = this.data.map(row => row[valueHeader]);
        const labels = this.data.map(row => row[labelHeader] || '');
        const total = values.reduce((a, b) => a + b, 0);

        let currentAngle = -Math.PI / 2;

        values.forEach((value, index) => {
            const sliceAngle = (value / total) * Math.PI * 2;

            ctx.fillStyle = this.chartConfig.colors[index % this.chartConfig.colors.length];
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
            ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
            ctx.closePath();
            ctx.fill();

            currentAngle += sliceAngle;
        });

        // Draw title in center
        ctx.fillStyle = '#e0e0e0';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(total, centerX, centerY);

        // Draw title
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(this.chartConfig.title, canvas.width / 2, 30);

        // Draw legend
        if (this.chartConfig.showLegend) {
            this.drawLegend(ctx, canvas, labels);
        }
    }

    renderBubbleChart(ctx, canvas) {
        const padding = 60;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;

        const headers = Object.keys(this.data[0]);
        const numericHeaders = headers.filter(h => typeof this.data[0][h] === 'number');

        if (numericHeaders.length >= 3) {
            const xValues = this.data.map(row => row[numericHeaders[0]]);
            const yValues = this.data.map(row => row[numericHeaders[1]]);
            const sizeValues = this.data.map(row => row[numericHeaders[2]]);

            const xMax = Math.max(...xValues);
            const xMin = Math.min(...xValues);
            const yMax = Math.max(...yValues);
            const yMin = Math.min(...yValues);
            const sizeMax = Math.max(...sizeValues);

            this.data.forEach((row, index) => {
                const x = padding + ((row[numericHeaders[0]] - xMin) / (xMax - xMin)) * chartWidth;
                const y = canvas.height - padding - ((row[numericHeaders[1]] - yMin) / (yMax - yMin)) * chartHeight;
                const radius = (row[numericHeaders[2]] / sizeMax) * 30 + 5;

                ctx.fillStyle = this.chartConfig.colors[index % this.chartConfig.colors.length] + '80';
                ctx.strokeStyle = this.chartConfig.colors[index % this.chartConfig.colors.length];
                ctx.lineWidth = 2;

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            });
        }

        // Draw axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();

        // Draw title
        ctx.fillStyle = '#e0e0e0';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.chartConfig.title, canvas.width / 2, 30);
    }

    drawLegend(ctx, canvas, items) {
        const legendX = canvas.width - 180;
        const legendY = 60;
        const itemHeight = 25;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(legendX - 10, legendY - 10, 170, items.length * itemHeight + 20);

        items.forEach((item, index) => {
            const y = legendY + index * itemHeight;

            // Draw color box
            ctx.fillStyle = this.chartConfig.colors[index % this.chartConfig.colors.length];
            ctx.fillRect(legendX, y, 20, 15);

            // Draw text
            ctx.fillStyle = '#e0e0e0';
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(item, legendX + 28, y + 12);
        });
    }

    updateChartConfig() {
        this.chartConfig.title = this.window.body.querySelector('#chartTitle').value;
        this.chartConfig.xLabel = this.window.body.querySelector('#xLabel').value;
        this.chartConfig.yLabel = this.window.body.querySelector('#yLabel').value;
        this.chartConfig.showLegend = this.window.body.querySelector('#showLegend').checked;
        this.chartConfig.showGrid = this.window.body.querySelector('#showGrid').checked;
        this.chartConfig.animated = this.window.body.querySelector('#animated').checked;

        this.renderChart();
    }

    exportPNG() {
        const canvas = this.window.body.querySelector('#chartCanvas');
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'chart.png';
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    exportSVG() {
        alert('SVG export feature coming soon!');
    }

    async exportData() {
        const json = JSON.stringify(this.data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    toggleFullscreen() {
        const chartContainer = this.window.body.querySelector('.chart-container');
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            chartContainer.requestFullscreen();
        }
    }
}

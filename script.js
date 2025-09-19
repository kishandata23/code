document.addEventListener('DOMContentLoaded', async function() {
    let problemsData = [];
    let parsedProblemsData = [];

    // Fetch from API
    async function loadProblems() {
        try {
            const response = await fetch("https://www.kishandata.in/api/code/data"); // <-- your API
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            problemsData = await response.json();

            // Convert dates to Date objects
            parsedProblemsData = problemsData.map(p => {
                const [day, month, year] = p.Date.split('-');
                return {
                    ...p,
                    parsedDate: new Date(year, month - 1, day)
                };
            });

            // After data is loaded → render everything
            renderCalendar();
            renderDailyProgressGrid();
            renderCurrentDayProblems(selectedCalendarDate);
            renderDifficultyProgress();

        } catch (error) {
            console.error("Error loading problems:", error);
        }
    }

    // --- Utility Functions ---
    function formatDateToYYYYMMDD(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatDateToDDMMYYYY(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    function isSameDay(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    function getProblemsForDate(date) {
        return parsedProblemsData.filter(p => isSameDay(p.parsedDate, date));
    }

    function getSolvedDates() {
        const solvedDatesSet = new Set();
        parsedProblemsData.forEach(p => {
            if (p.Status === 'Completed') {
                solvedDatesSet.add(formatDateToDDMMYYYY(p.parsedDate));
            }
        });
        return solvedDatesSet;
    }

    function getDailySolvedCounts() {
        const dailyCounts = new Map();
        parsedProblemsData.forEach(p => {
            if (p.Status === 'Completed') {
                const dateKey = formatDateToYYYYMMDD(p.parsedDate);
                dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
            }
        });
        return dailyCounts;
    }

    // --- Global Variables ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentCalendarDate = new Date(today.getFullYear(), today.getMonth(), 1);
    let selectedCalendarDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    selectedCalendarDate.setHours(0, 0, 0, 0);

    // --- Render Functions ---
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    function renderCalendar() {
        calendarGrid.innerHTML = '';
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();

        currentMonthYear.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentCalendarDate);

        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayLabels.forEach(label => {
            const dayLabelDiv = document.createElement('div');
            dayLabelDiv.classList.add('day-label');
            dayLabelDiv.textContent = label;
            calendarGrid.appendChild(dayLabelDiv);
        });

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.classList.add('empty');
            calendarGrid.appendChild(emptyDiv);
        }

        const solvedDates = getSolvedDates();
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);

            dayDiv.textContent = day;
            dayDiv.dataset.date = formatDateToDDMMYYYY(date);
            dayDiv.classList.add('current-month');

            if (isSameDay(date, today)) {
                dayDiv.classList.add('today');
            }
            if (isSameDay(date, selectedCalendarDate)) {
                dayDiv.classList.add('selected-date');
            }
            if (solvedDates.has(formatDateToDDMMYYYY(date))) {
                dayDiv.classList.add('solved-day');
            }

            dayDiv.addEventListener('click', () => {
                const previouslySelected = calendarGrid.querySelector('.selected-date');
                if (previouslySelected) {
                    previouslySelected.classList.remove('selected-date');
                }
                dayDiv.classList.add('selected-date');
                selectedCalendarDate = date;
                renderCurrentDayProblems(date);
            });
            calendarGrid.appendChild(dayDiv);
        }
    }

    prevMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });

    const progressGridContainer = document.getElementById('progressGridContainer');
    function renderDailyProgressGrid() {
        progressGridContainer.innerHTML = '';
        const endDate = new Date(today);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 365);

        const dailySolvedCounts = getDailySolvedCounts();
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const square = document.createElement('div');
            square.classList.add('progress-square');

            const dateKey = formatDateToYYYYMMDD(currentDate);
            const solvedCount = dailySolvedCounts.get(dateKey) || 0;

            let level = 0;
            if (solvedCount === 1) level = 1;
            else if (solvedCount >= 2 && solvedCount <= 3) level = 2;
            else if (solvedCount >= 4 && solvedCount <= 5) level = 3;
            else if (solvedCount >= 6) level = 4;

            square.classList.add(`level-${level}`);
            square.title = `${formatDateToDDMMYYYY(currentDate)}: ${solvedCount} problem(s) solved`;
            progressGridContainer.appendChild(square);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    const currentDayProblemsList = document.getElementById('currentDayProblemsList');
    const currentDayProblemsDateElem = document.getElementById('currentDayProblemsDate');
    const noCurrentDayProblemsElem = document.getElementById('noCurrentDayProblems');

    function renderCurrentDayProblems(date) {
        currentDayProblemsList.innerHTML = '';
        const problems = getProblemsForDate(date);
        currentDayProblemsDateElem.textContent = isSameDay(date, today) ? 'Today' : formatDateToDDMMYYYY(date);

        if (problems.length === 0) {
            noCurrentDayProblemsElem.style.display = 'block';
        } else {
            noCurrentDayProblemsElem.style.display = 'none';
            problems.forEach(p => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <div>
                        <span class="problem-title">${p.Problem}</span>
                        <span class="problem-meta"> - ${p.Difficult} (${p.Language})</span>
                    </div>
                    <span class="problem-meta">${p.Status}</span>
                `;
                currentDayProblemsList.appendChild(listItem);
            });
        }
    }

    const showLast7DaysBtn = document.getElementById('showLast7DaysBtn');
    const last7DaysModal = document.getElementById('last7DaysModal');
    const closeButton = last7DaysModal.querySelector('.close-button');
    const last7DaysProblemsList = document.getElementById('last7DaysProblemsList');
    const noLast7DaysProblemsElem = document.getElementById('noLast7DaysProblems');

    function renderLast7DaysProblems() {
        last7DaysProblemsList.innerHTML = '';
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const recentProblems = parsedProblemsData.filter(p => p.parsedDate >= sevenDaysAgo && p.parsedDate <= today)
                                                 .sort((a, b) => b.parsedDate - a.parsedDate);

        if (recentProblems.length === 0) {
            noLast7DaysProblemsElem.style.display = 'block';
        } else {
            noLast7DaysProblemsElem.style.display = 'none';
            recentProblems.forEach(p => {
                const listItem = document.createElement('li');
                listItem.classList.add(p.Status.toLowerCase());
                listItem.innerHTML = `
                    <div>
                        <span class="problem-title">${p.Problem}</span>
                        <span class="problem-meta"> - ${formatDateToDDMMYYYY(p.parsedDate)} (${p.Language})</span>
                    </div>
                    <span class="problem-meta">${p.Status}</span>
                `;
                last7DaysProblemsList.appendChild(listItem);
            });
        }
    }

    showLast7DaysBtn.addEventListener('click', () => {
        renderLast7DaysProblems();
        last7DaysModal.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        last7DaysModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == last7DaysModal) {
            last7DaysModal.style.display = 'none';
        }
    });

    const easyProgressBar = document.getElementById('easyProgressBar');
    const mediumProgressBar = document.getElementById('mediumProgressBar');
    const hardProgressBar = document.getElementById('hardProgressBar');
    const easyProgressText = document.getElementById('easyProgressText');
    const mediumProgressText = document.getElementById('mediumProgressText');
    const hardProgressText = document.getElementById('hardProgressText');

    function renderDifficultyProgress() {
        const difficultyStats = { Easy: { solved: 0, total: 0 }, Medium: { solved: 0, total: 0 }, Hard: { solved: 0, total: 0 } };

        parsedProblemsData.forEach(p => {
            if (p.Difficult in difficultyStats) {
                difficultyStats[p.Difficult].total++;
                if (p.Status === 'Completed') {
                    difficultyStats[p.Difficult].solved++;
                }
            }
        });

        function updateProgressBar(progressBar, progressText, stats) {
            const percentage = stats.total > 0 ? (stats.solved / stats.total) * 100 : 0;
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = `${stats.solved}/${stats.total} (${percentage.toFixed(0)}%)`;
        }

        updateProgressBar(easyProgressBar, easyProgressText, difficultyStats.Easy);
        updateProgressBar(mediumProgressBar, mediumProgressText, difficultyStats.Medium);
        updateProgressBar(hardProgressBar, hardProgressText, difficultyStats.Hard);
    }

    // --- Initial fetch and render ---
    loadProblems();
});

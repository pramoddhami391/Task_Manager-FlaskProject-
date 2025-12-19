/**
 * TASK MANAGER FRONTEND - JavaScript
 * 
 * This file handles all the interactive features:
 * 1. Loading tasks from the server
 * 2. Displaying tasks on the page
 * 3. Adding new tasks
 * 4. Editing tasks
 * 5. Deleting tasks
 * 6. Filtering tasks (All, Active, Completed)
 * 
 * How it communicates with backend:
 * - Uses fetch() to send/receive data via API endpoints
 * - Converts data to/from JSON format
 */

// ============================================================================
// STEP 1: GLOBAL VARIABLES
// ============================================================================

// Keep track of which filter is currently active ('all', 'active', or 'completed')
let currentFilter = 'all';

// Keep track of which task is currently being edited (null if no task being edited)
let editingTaskId = null;

// Store all tasks fetched from the server
window.tasks = [];


// ============================================================================
// STEP 2: GET REFERENCES TO HTML ELEMENTS
// ============================================================================
// These "grab" elements from the HTML so we can interact with them

const taskForm = document.getElementById('taskForm');  // The form to add new tasks
const taskTitle = document.getElementById('taskTitle');  // Input field for task title
const taskDescription = document.getElementById('taskDescription');  // Input field for description
const taskDueDate = document.getElementById('taskDueDate');  // Input field for due date
const tasksList = document.getElementById('tasksList');  // Container where tasks are displayed
const filterButtons = document.querySelectorAll('.filter-btn');  // All filter buttons (All, Active, Completed)


// ============================================================================
// STEP 3: INITIALIZATION
// ============================================================================
// Run this code when the page first loads

document.addEventListener('DOMContentLoaded', () => {
    /**
     * DOMContentLoaded: Special event that fires when HTML is fully loaded
     * This makes sure all our HTML elements exist before we try to use them
     */
    console.log('Page loaded! Starting application...');
    loadTasks();  // Load tasks from server
    setupEventListeners();  // Set up click/submit handlers
});


// ============================================================================
// STEP 4: EVENT LISTENERS SETUP
// ============================================================================
// Connect buttons and forms to their handler functions

function setupEventListeners() {
    /**
     * Set up event listeners for:
     * 1. Form submission (when user clicks "Add Task")
     * 2. Filter buttons (when user clicks All/Active/Completed)
     */
    
    // When user submits the form (clicks "Add Task" or presses Enter)
    taskForm.addEventListener('submit', handleAddTask);
    
    // Set up each filter button
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove 'active' class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            
            // Add 'active' class to clicked button
            e.target.classList.add('active');
            
            // Update currentFilter variable based on which button was clicked
            currentFilter = e.target.dataset.filter;
            
            // Re-render tasks with new filter applied
            renderTasks();
        });
    });
}


// ============================================================================
// STEP 5: LOAD TASKS FROM SERVER
// ============================================================================

async function loadTasks() {
    /**
     * Fetch all tasks from the server.
     * 
     * What this does:
     * 1. Sends GET request to /api/tasks endpoint (asks server for all tasks)
     * 2. Waits for response (await makes code pause until response comes back)
     * 3. Converts response to JSON format
     * 4. Stores tasks in window.tasks array
     * 5. Calls renderTasks() to display them on page
     * 
     * Why "async"?
     * - async/await makes it easier to work with network requests
     * - Code waits for server response before continuing
     */
    try {
        console.log('Fetching tasks from server...');
        
        // Send GET request to /api/tasks
        const response = await fetch('/api/tasks');
        
        // Convert response to JavaScript objects
        const tasks = await response.json();
        
        // Store tasks in global variable
        window.tasks = tasks;
        
        console.log(`Loaded ${tasks.length} tasks from server`);
        
        // Display the tasks on the page
        renderTasks();
        
    } catch (error) {
        // If something goes wrong, show error message
        console.error('Error loading tasks:', error);
        tasksList.innerHTML = '<p class="no-tasks">❌ Error loading tasks. Please try again.</p>';
    }
}


// ============================================================================
// STEP 6: RENDER TASKS ON PAGE
// ============================================================================

function renderTasks() {
    /**
     * Display tasks on the page based on current filter.
     * 
     * This function:
     * 1. Takes all tasks from window.tasks
     * 2. Filters them based on currentFilter ('all', 'active', or 'completed')
     * 3. Converts each task to HTML using createTaskElement()
     * 4. Displays HTML on the page
     * 5. Adds event listeners to all buttons in the displayed tasks
     */
    
    // Start with all tasks
    let filteredTasks = window.tasks || [];
    
    // Apply filter based on currentFilter variable
    if (currentFilter === 'active') {
        // Show only incomplete tasks
        filteredTasks = filteredTasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        // Show only completed tasks
        filteredTasks = filteredTasks.filter(t => t.completed);
    }
    // If currentFilter === 'all', show all tasks (no filtering needed)
    
    // If no tasks to show, display message
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<p class="no-tasks">No tasks to show. Add one to get started!</p>';
        return;
    }
    
    // Convert each task to HTML and display
    // map() transforms each task into HTML
    // join('') combines all HTML strings together
    tasksList.innerHTML = filteredTasks.map(task => createTaskElement(task)).join('');
    
    // Now add event listeners to all the buttons we just created
    attachTaskEventListeners();
}


// ============================================================================
// STEP 7: ATTACH EVENT LISTENERS TO TASK BUTTONS
// ============================================================================

function attachTaskEventListeners() {
    /**
     * Add click handlers to all the buttons in displayed tasks.
     * 
     * This includes:
     * - Checkboxes (to toggle completion)
     * - Edit buttons (to edit task)
     * - Delete buttons (to delete task)
     */
    
    // Set up checkbox listeners (for toggling task completion)
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const taskId = parseInt(e.target.dataset.taskId);
            toggleTask(taskId);
        });
    });
    
    // Set up delete button listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = parseInt(e.target.dataset.taskId);
            deleteTask(taskId);
        });
    });
    
    // Set up edit button listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = parseInt(e.target.dataset.taskId);
            const task = window.tasks.find(t => t.id === taskId);  // Find the task object
            startEditingTask(taskId, task);
        });
    });
}


// ============================================================================
// STEP 8: CREATE TASK HTML ELEMENT
// ============================================================================

function createTaskElement(task) {
    /**
     * Convert a task object into HTML that can be displayed on the page.
     * 
     * This function builds a task card with:
     * - Checkbox to mark complete/incomplete
     * - Task title and description
     * - Creation date and due date
     * - Edit and Delete buttons
     * 
     * Returns: HTML string representing the task
     */
    
    // Determine if task is completed (add 'completed' class if it is)
    const isCompleted = task.completed ? 'completed' : '';
    
    // Format due date for display (converts '2025-12-05' to '12/5/2025')
    const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : '';
    const dueDateHtml = dueDate ? `<span class="task-date">📅 ${dueDate}</span>` : '';
    
    // Format creation date for display
    const createdDate = new Date(task.created_at).toLocaleDateString();
    
    // Return HTML string (backticks allow multi-line strings and ${} for variables)
    return `
        <div class="task-item ${isCompleted}" id="task-${task.id}">
            <!-- Checkbox to toggle completion -->
            <input 
                type="checkbox" 
                class="task-checkbox" 
                data-task-id="${task.id}"
                ${task.completed ? 'checked' : ''}
            >
            
            <!-- Task content (title, description, dates) -->
            <div class="task-content">
                <div class="task-title">${escapeHtml(task.title)}</div>
                ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    <span class="task-date">📆 ${createdDate}</span>
                    ${dueDateHtml}
                </div>
            </div>
            
            <!-- Edit and Delete buttons -->
            <div class="task-actions">
                <button class="task-btn edit-btn" data-task-id="${task.id}">Edit</button>
                <button class="task-btn delete-btn" data-task-id="${task.id}">Delete</button>
            </div>
        </div>
    `;
}


// ============================================================================
// STEP 9: ESCAPE HTML (Security)
// ============================================================================

function escapeHtml(text) {
    /**
     * Convert special HTML characters to safe text.
     * 
     * Why is this important?
     * If user enters: <script>alert('hack')</script>
     * Without escaping, this would run as JavaScript
     * With escaping, it displays as plain text
     * 
     * This prevents XSS (Cross-Site Scripting) attacks.
     */
    const map = {
        '&': '&amp;',      // & becomes &amp;
        '<': '&lt;',       // < becomes &lt;
        '>': '&gt;',       // > becomes &gt;
        '"': '&quot;',     // " becomes &quot;
        "'": '&#039;'      // ' becomes &#039;
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}


// ============================================================================
// STEP 10: ADD NEW TASK
// ============================================================================

async function handleAddTask(e) {
    /**
     * Handle form submission when user clicks "Add Task".
     * 
     * What this does:
     * 1. Prevents default form submission (page reload)
     * 2. Gets values from input fields
     * 3. Validates that title is not empty
     * 4. Sends POST request to /api/tasks with task data
     * 5. If successful, adds new task to window.tasks
     * 6. Re-renders tasks on page
     * 7. Clears the form inputs
     */
    
    // Prevent page from reloading on form submit
    e.preventDefault();
    
    // Get values from input fields and remove extra whitespace
    const title = taskTitle.value.trim();
    const description = taskDescription.value.trim();
    const dueDate = taskDueDate.value;
    
    // Make sure title is not empty
    if (!title) {
        alert('Please enter a task title');
        return;
    }
    
    try {
        console.log('Sending task to server...', { title, description, dueDate });
        
        // Send POST request to /api/tasks with task data
        const response = await fetch('/api/tasks', {
            method: 'POST',  // HTTP method (POST = create new)
            headers: {
                'Content-Type': 'application/json',  // Tell server we're sending JSON
            },
            body: JSON.stringify({  // Convert data to JSON string
                title,
                description,
                due_date: dueDate
            })
        });
        
        // Check if request was successful (status 201 = Created)
        if (response.ok) {
            // Get the newly created task from response
            const newTask = await response.json();
            
            // Add new task to beginning of array
            window.tasks = [newTask, ...(window.tasks || [])];
            
            console.log('Task added successfully!', newTask);
            
            // Re-render tasks on page (will show new task)
            renderTasks();
            
            // Clear all form inputs
            taskForm.reset();
        }
    } catch (error) {
        console.error('Error adding task:', error);
        alert('Failed to add task. Please try again.');
    }
}



// ============================================================================
// STEP 11: TOGGLE TASK COMPLETION
// ============================================================================

async function toggleTask(taskId) {
    /**
     * Toggle a task's completion status (checked <-> unchecked).
     * 
     * What this does:
     * 1. Sends PATCH request to /api/tasks/{taskId}/toggle
     * 2. Receives updated task from server
     * 3. Updates task in window.tasks array
     * 4. Re-renders tasks on page
     * 
     * Note: PATCH is used for partial updates (only changing one field)
     */
    try {
        console.log(`Toggling task ${taskId}...`);
        
        // Send PATCH request to toggle endpoint
        const response = await fetch(`/api/tasks/${taskId}/toggle`, {
            method: 'PATCH',  // PATCH = partial update
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        // If successful, update local data
        if (response.ok) {
            const updatedTask = await response.json();
            
            // Find the task in our array and update it
            const taskIndex = window.tasks.findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
                window.tasks[taskIndex] = updatedTask;
                renderTasks();
            }
        }
    } catch (error) {
        console.error('Error toggling task:', error);
        alert('Failed to toggle task');
    }
}


// ============================================================================
// STEP 12: DELETE TASK
// ============================================================================

async function deleteTask(taskId) {
    /**
     * Delete a task from the database.
     * 
     * What this does:
     * 1. Asks user for confirmation (prevent accidental deletion)
     * 2. Sends DELETE request to /api/tasks/{taskId}
     * 3. Removes task from window.tasks array
     * 4. Re-renders tasks on page
     */
    
    // Ask user to confirm before deleting
    if (!confirm('Are you sure you want to delete this task? This cannot be undone.')) {
        return;  // If user clicks Cancel, stop here
    }
    
    try {
        console.log(`Deleting task ${taskId}...`);
        
        // Send DELETE request to remove task from database
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'  // DELETE = remove
        });
        
        // If successful, remove from local array
        if (response.ok) {
            // Keep only tasks that don't match the deleted taskId
            window.tasks = window.tasks.filter(t => t.id !== taskId);
            
            console.log('Task deleted successfully!');
            
            // Re-render tasks on page
            renderTasks();
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task');
    }
}


// ============================================================================
// STEP 13: EDIT TASK - START EDITING
// ============================================================================

function startEditingTask(taskId, task) {
    /**
     * Enter "edit mode" for a task.
     * 
     * What this does:
     * 1. Closes any other task being edited
     * 2. Replaces task display with edit input fields
     * 3. Sets up Save and Cancel buttons
     * 4. Shows old task values in the input fields
     */
    
    // If another task is being edited, cancel it first
    if (editingTaskId !== null && editingTaskId !== taskId) {
        cancelEditing();
    }
    
    // Mark this task as being edited
    editingTaskId = taskId;
    
    // Get the task element from HTML
    const taskElement = document.getElementById(`task-${taskId}`);
    
    // Add 'edit-mode' class to change styling
    taskElement.classList.add('edit-mode');
    
    // Replace task content with edit form
    taskElement.innerHTML = `
        <div class="task-content" style="width: 100%;">
            <!-- Edit title input -->
            <input 
                type="text" 
                class="edit-input" 
                id="edit-title-${taskId}" 
                value="${escapeHtml(task.title)}"
            >
            
            <!-- Edit description input -->
            <input 
                type="text" 
                class="edit-input" 
                id="edit-description-${taskId}" 
                value="${escapeHtml(task.description || '')}"
                placeholder="Description (optional)"
            >
            
            <!-- Edit due date input -->
            <input 
                type="date" 
                class="edit-input" 
                id="edit-due-date-${taskId}" 
                value="${task.due_date || ''}"
            >
            
            <!-- Save and Cancel buttons -->
            <div class="edit-actions">
                <button class="save-btn">Save</button>
                <button class="cancel-btn" type="button">Cancel</button>
            </div>
        </div>
    `;
    
    // Add click handlers to Save and Cancel buttons
    document.querySelector(`#task-${taskId} .save-btn`).addEventListener('click', () => {
        saveEditedTask(taskId);
    });
    
    document.querySelector(`#task-${taskId} .cancel-btn`).addEventListener('click', () => {
        cancelEditing();
    });
}



// ============================================================================
// STEP 14: EDIT TASK - SAVE EDITED TASK
// ============================================================================

async function saveEditedTask(taskId) {
    /**
     * Save the edited task to the database.
     * 
     * What this does:
     * 1. Gets new values from the edit input fields
     * 2. Validates that title is not empty
     * 3. Sends PUT request to /api/tasks/{taskId} with updated data
     * 4. Updates task in window.tasks
     * 5. Re-renders tasks (exits edit mode)
     */
    
    // Get new values from edit inputs
    const title = document.getElementById(`edit-title-${taskId}`).value.trim();
    const description = document.getElementById(`edit-description-${taskId}`).value.trim();
    const dueDate = document.getElementById(`edit-due-date-${taskId}`).value;
    
    // Validate that title is not empty
    if (!title) {
        alert('Task title cannot be empty');
        return;
    }
    
    try {
        console.log(`Saving task ${taskId}...`);
        
        // Send PUT request with updated task data
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',  // PUT = replace/update entire resource
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                description,
                due_date: dueDate
            })
        });
        
        // If successful, update local data
        if (response.ok) {
            const updatedTask = await response.json();
            
            // Find and update task in array
            const taskIndex = window.tasks.findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
                window.tasks[taskIndex] = updatedTask;
                
                console.log('Task saved successfully!', updatedTask);
                
                // Exit edit mode and re-render
                editingTaskId = null;
                renderTasks();
            }
        }
    } catch (error) {
        console.error('Error saving task:', error);
        alert('Failed to save task');
    }
}


// ============================================================================
// STEP 15: EDIT TASK - CANCEL EDITING
// ============================================================================

function cancelEditing() {
    /**
     * Exit edit mode without saving changes.
     * 
     * What this does:
     * 1. Clears editingTaskId
     * 2. Re-renders tasks to show normal view again
     * 
     * This discards any changes made in edit mode.
     */
    if (editingTaskId !== null) {
        console.log('Canceling edit mode');
        editingTaskId = null;
        renderTasks();
    }
}


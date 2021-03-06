// Define UI Variables 
const taskInput = document.querySelector('#task'); //the task input text field
const form = document.querySelector('#task-form'); //The form at the top
const filter = document.querySelector('#filter'); //the task filter text field
const taskList = document.querySelector('.collection'); //The UL
const clearBtn = document.querySelector('.clear-tasks'); //the all task clear button

const reloadIcon = document.querySelector('.fa'); //the reload button at the top navigation 
const orderBtn = document.querySelector('.order-options');


//// index db code

// DB var
let DB;

// add event listner on load
document.addEventListener("DOMContentLoaded", () => {
    // open DB if non existient create DB
    let TasksDB = indexedDB.open("tasks", 1);

    TasksDB.onsuccess = function(e){
        console.log("Database created!");
        DB = TasksDB.result;
        updateTaskList();
    }

    TasksDB.onerror = function(e){
        console.log("Error!");
    }

    // This method runs once (great for creating the schema)
    TasksDB.onupgradeneeded = function(e) {
        // the event will be the database
        let db = e.target.result;
        
        // create an object store,
        // keypath is going to be the Indexes
        let objectStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
        
        // createindex: 1) field name 2) keypath 3) options
        objectStore.createIndex('taskname', 'taskname', { unique: false });
        objectStore.createIndex('time', 'time', { unique: true });
        console.log('Database ready and fields created!');
    }


    // add new task to db
    form.addEventListener('submit', addNewTask);
    function addNewTask(e){
        e.preventDefault();

        if (!taskInput.value){
            alert('Enter task!');
            return;
        }

        const date = new Date();
        let newTask = {
            taskname : taskInput.value,
            time : date.getTime()
        };

        let transaction = DB.transaction(['tasks'], 'readwrite');
        let objectStore = transaction.objectStore('tasks', 'readwrite');

        let request = objectStore.add(newTask);
        request.onsuccess = function(){
            form.reset();
            console.log("Successfully added");
            // displayTaskList();
            updateTaskList();
        }
        // transaction.oncomplete =
        transaction.onerror = function(){
            console.log("Error happend on adding");
        }
    }

    // clear everything
    clearBtn.addEventListener('click', clearAllTasks);
    function clearAllTasks(e){
        //Create the transaction and object store
        let transaction = DB.transaction("tasks", "readwrite");
        let tasks = transaction.objectStore("tasks");
        // clear the the table
        tasks.clear();
        //repaint the UI
        displayTaskList();
        console.log("Tasks Cleared !!!");
    }
    
    // remove task item
    taskList.addEventListener('click', removeTask);
    function removeTask(e){
        if (e.target.parentElement.classList.contains('delete-item')) {
            if (confirm('Are You Sure about that ?')) {
                // get the task id
                let taskID = Number(e.target.parentElement.parentElement.getAttribute('data-task-id'));
                // use a transaction
                let transaction = DB.transaction('tasks', 'readwrite');
                let objectStore = transaction.objectStore('tasks');
                objectStore.delete(taskID);
                transaction.oncomplete = () => {
                    e.target.parentElement.parentElement.remove();
                }
            }
        }
        
    }
    
    // change order 
    orderBtn.addEventListener("change", changeSortOrderWrapper);
    function changeSortOrderWrapper(e){
        updateTaskList(e.target.value);
    }
    
    // update task list via addition or order change
    function updateTaskList(order = orderBtn.value){
        let objectStore = DB.transaction('tasks').objectStore('tasks');
        var ids = [];
        var timestamps = [];
        var sortedIDs = [];
        objectStore.openCursor().onsuccess = function(e) {
            let cursor = e.target.result;
            
            // collecting all ids and timestamps for sorting
            if (cursor){
                ids.push( cursor.value.id );
                timestamps.push( cursor.value.time );
                cursor.continue();
            }
            
            // code to execute when cursor finishes
            else {
                if (order == '1'){
                    // ascending
                    sortedIDs = sort(1, timestamps, ids);
                    displaySortedTaskList(sortedIDs);
                    return
                }
                // descending
                sortedIDs = sort(2, timestamps, ids);
                displaySortedTaskList(sortedIDs);
            }   
        }
    }
    
    function displaySortedTaskList(ids){
        while (taskList.firstChild) { taskList.removeChild(taskList.firstChild);}
        // create the object store
        let objectStore = DB.transaction('tasks').objectStore('tasks');
        // index for current id in sortred ids
        var i = 0;
        objectStore.openCursor().onsuccess = function(e) {
            // assign the current cursor
            let cursor = e.target.result;
            
            if (cursor) {
                // get task item using id from sorted id list
                taskRequest = objectStore.get(ids[i]);
                taskRequest.onsuccess = function(e){
                    var task = taskRequest.result;
                    // Create an li element when the user adds a task 
                    const li = document.createElement('li');
                    
                    li.setAttribute('data-task-id', task.id);
                    // Create text node and append it
                    li.appendChild(document.createTextNode(task.taskname));
                    
                    // Adding a class
                    li.className = 'collection-item';
                    // Create text node and append it 
                    li.appendChild(document.createTextNode(taskInput.value));
                    // Create new element for the link 
                    const link = document.createElement('a');
                    // Add class and the x marker for a 
                    link.className = 'delete-item secondary-content';
                    link.innerHTML = `
                    <i class="fa fa-remove"></i> &nbsp;
                    <a href="././edit.html?id=${task.id}"><i class="fa fa-edit"></i> </a>
                    `;
                    // Append link to li
                    li.appendChild(link);
                    // create new element for date
                    const date = document.createElement('div');
                    date.className = 'secondary-content';
                    date.style.paddingRight = '2rem';
                    date.appendChild(document.createTextNode( new Date(task.time).toLocaleString('en-US') ));
                    li.appendChild(date);
                    // Append to UL 
                    taskList.appendChild(li);
                    i += 1;
                }
                cursor.continue();
            }
        }
    }
    
    // sort ids by timestamps
    function sort(type, timestamps, ids){
        if(type == 2){
            // sort in descending order
            for(let i = 0; i < timestamps.length; i++){
                for (let j = timestamps.length - 1; j > i; j--) {
                    if(timestamps[j] > timestamps[j - 1]){
                        tmp = timestamps[j];
                        timestamps[j] = timestamps[j - 1];
                        timestamps[j - 1] = tmp;
                        tmp2 = ids[j];
                        ids[j] = ids[j - 1];
                        ids[j - 1] = tmp2;
                    }
                }
            }
            return ids
        }
        
        
        else if(type == 1){
            // sort in ascending order
            for(let i = 0; i < timestamps.length; i++){
                for (let j = timestamps.length - 1; j > i; j--) {
                    if(timestamps[j] < timestamps[j - 1]){
                        tmp = timestamps[j];
                        timestamps[j] = timestamps[j - 1];
                        timestamps[j - 1] = tmp;
                        tmp2 = ids[j];
                        ids[j] = ids[j - 1];
                        ids[j - 1] = tmp2;
                    }
                }
            }
            return ids
        }
        
        return;
    }
    
    // function displayTaskList(){
    //     // clear the previous task list
    //     while (taskList.firstChild) { taskList.removeChild(taskList.firstChild);}
    //     // create the object store
    //     let objectStore = DB.transaction('tasks').objectStore('tasks');
    //     objectStore.openCursor().onsuccess = function(e) {
    //         // assign the current cursor
    //         let cursor = e.target.result;
    //         if (cursor) {
    //             // Create an li element when the user adds a task 
    //             const li = document.createElement('li');
                
    //             li.setAttribute('data-task-id', cursor.value.id);
    //             // Create text node and append it
    //             li.appendChild(document.createTextNode(cursor.value.taskname));
                
    //             // Adding a class
    //             li.className = 'collection-item';
    //             // Create text node and append it 
    //             li.appendChild(document.createTextNode(taskInput.value));
    //             // Create new element for the link 
    //             const link = document.createElement('a');
    //             // Add class and the x marker for a 
    //             link.className = 'delete-item secondary-content';
    //             link.innerHTML = `
    //                 <i class="fa fa-remove"></i> &nbsp;
    //                 <a href="././edit.html?id=${cursor.value.id}"><i class="fa fa-edit"></i> </a>
    //             `;
    //             // Append link to li
    //             li.appendChild(link);
    //             // create new element for date
    //             const date = document.createElement('div');
    //             date.className = 'secondary-content';
    //             date.style.paddingRight = '2rem';
    //             date.appendChild(document.createTextNode( new Date(cursor.value.time).toLocaleString('en-US') ));
    //             li.appendChild(date);
    //             // Append to UL 
    //             taskList.appendChild(li);
    //             cursor.continue();
    //         }
    //     }
    // }
}) 
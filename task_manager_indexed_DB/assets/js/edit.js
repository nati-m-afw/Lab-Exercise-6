//UI variables 
const form = document.querySelector('#task-form'); //The form at the top
const taskInput = document.querySelector('#task'); //the task input text field

//read from q string 
const urlParams = new URLSearchParams(window.location.search);
const id = Number(urlParams.get('id'));
//DB
var DB;

// Add Event Listener [on Load]
document.addEventListener('DOMContentLoaded', () => {
    // create the database
    let TasksDB = indexedDB.open('tasks', 1);

    // if there's an error
    TasksDB.onerror = function() {
            console.log('There was an error');
        }
        // if everything is fine, assign the result to the instance
    TasksDB.onsuccess = function() {
        // console.log('Database Ready');

        // save the result
        DB = TasksDB.result;

        // display the Task 
        displayTask();
    }


    function displayTask() {

        var transaction = DB.transaction(['tasks']);
        var objectStore = transaction.objectStore('tasks');
        var request = objectStore.get(id);

        request.onsuccess = function(event) {
            if (request.result) {
                taskInput.value = request.result.taskname;

            } else {
                console.log('No data record');
            }
        };

        request.onerror = function(event) {
            console.log('Transaction failed');
        };



    }


    form.addEventListener('submit', updateTask);

    function updateTask(e) {
        e.preventDefault();

        // Check empty entry
        if (taskInput.value === '') {
            taskInput.style.borderColor = "red";

            return;
        }


        var transaction = DB.transaction(['tasks'], 'readwrite');
        var objectStore = transaction.objectStore('tasks', 'readwrite');
        var request = objectStore.get(id);

        request.onsuccess = function(e){
            const task = e.target.result;
            console.log(task.taskname);
            task.taskname = taskInput.value;
            const updateRequest = objectStore.put(task);
            
            updateRequest.onsuccess = () => {
                console.log("Successfully updated");
            }

            updateRequest.onerror = () => {
                console.log("Error happened on updating");
            }

        }
        // transaction.oncomplete =
        transaction.onerror = function(){
            console.log("Error happend on fetching");
        }
        /* 
        Instruction set to handle Update

        1. Declare the transaction and object store objects 
        2. Use the id on put method of index db
        
        */

        history.back();
    }




});
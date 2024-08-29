const express = require('express')

const format = require('date-fns/format')
const isValid = require('date-fns/isValid')

const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

intializeDbAndServer()

const hasStatus = queryObject => {
  return queryObject.status !== undefined
}

const hasPriority = queryObject => {
  return queryObject.priority !== undefined
}

const hasPriorityAndStatus = queryObject => {
  return queryObject.status !== undefined && queryObject.priority !== undefined
}

const hasCategoryAndStatus = queryObject => {
  return queryObject.category !== undefined && queryObject.status !== undefined
}

const hasCategory = queryObject => {
  return queryObject.category !== undefined
}

const hasCategoryAndPriority = queryObject => {
  return (
    queryObject.category !== undefined && queryObject.priority !== undefined
  )
}

const todoStatus = ['TO DO', 'IN PROGRESS', 'DONE']
const todoPriority = ['HIGH', 'MEDIUM', 'LOW']
const todoCategory = ['WORK', 'HOME', 'LEARNING']

//Get Todo Items
app.get('/todos/', async (request, response) => {
  const {search_q = '', status, priority, category} = request.query
  let todoList = null
  let getTodoQuery = ''

  switch (true) {
    case hasStatus(request.query):
      if (todoStatus.includes(status)) {
        getTodoQuery = `
          SELECT
            *
          FROM
            todo
          WHERE
            todo LIKE "%${search_q}%"
            AND status = "${status}";   
        `
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case hasPriority(request.query):
      if (todoPriority.includes(priority)) {
        getTodoQuery = `
          SELECT
            *
          FROM
            todo
          WHERE
            todo LIKE "%${search_q}%"
            AND priority = "${priority}";   
        `
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasCategory(request.query):
      if (todoCategory.includes(category)) {
        getTodoQuery = `
          SELECT
            *
          FROM
            todo
          WHERE
            todo LIKE "%${search_q}%"
            AND category = "${category}";   
        `
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasPriorityAndStatus(request.query):
      if ((todoStatus.includes(status) && todoPriority, includes(priority))) {
        getTodoQuery = `
          SELECT
            *
          FROM  
            todo
          WHERE
            todo LIKE "%${search_q}%"
            AND status = "${status}"
            AND priority = "${priority}"; 
        `
      } else {
        response.status(400)

        if (todoStatus.includes(status) === false) {
          response.send('Invalid Todo Status')
        } else {
          response.send('Invalid Todo Priority')
        }
      }
      break
    case hasCategoryAndStatus(request.query):
      if (todoStatus.includes(status) && todoCategory.includes(category)) {
        getTodoQuery = `
          SELECT
            *
          FROM  
            todo
          WHERE
            todo LIKE "%${search_q}%"
            AND status = "${status}"
            AND category = "${category}"; 
        `
      } else {
        response.status(400)

        if (todoStatus.includes(status) === false) {
          response.send('Invalid Todo Status')
        } else {
          response.send('Invalid Todo Category')
        }
      }
      break
    case hasCategoryAndPriority(request.query):
      if (todoCategory.includes(category) && todoPriority.includes(priority)) {
        getTodoQuery = `
          SELECT
            *
          FROM  
            todo
          WHERE
            todo LIKE "%${search_q}%"
            AND category = "${category}"
            AND priority = "${priority}"; 
        `
      } else {
        response.status(400)

        if (todoStatus.includes(category) === false) {
          response.send('Invalid Todo Category')
        } else {
          response.send('Invalid Todo Priority')
        }
      }
      break
    default:
      getTodoQuery = `
        SELECT
          *
        FROM
          todo
        WHERE
          todo LIKE "%${search_q}%";  
      `
  }

  todoList = await db.all(getTodoQuery)
  response.send(
    todoList.map(eachTodo => ({
      id: eachTodo.id,
      todo: eachTodo.todo,
      status: eachTodo.status,
      priority: eachTodo.priority,
      category: eachTodo.category,
      dueDate: eachTodo.due_date,
    })),
  )
})

//Get Todo Item API
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};
  `

  const todoItem = await db.get(getTodoQuery)
  response.send({
    id: todoItem.id,
    todo: todoItem.todo,
    priority: todoItem.priority,
    status: todoItem.status,
    category: todoItem.category,
    dueDate: todoItem.due_date,
  })
})

//Get Todo Items From due Date API
app.get('/agenda/', async (request, response) => {
  const {date} = request.query

  const givenDate = new Date(date)
  console.log(givenDate)

  const formattedDate = format(givenDate, 'yyyy-MM-dd')
  console.log(formattedDate)

  const isValidDate = isValid(givenDate)
  console.log(isValidDate)
  if (isValidDate) {
    const getTodoQuery = `
      SELECT
        *
      FROM
        todo
      WHERE
        due_date = '${formattedDate}';    
    `

    const todoItemsList = await db.all(getTodoQuery)
    console.log(todoItemsList)
    response.send(
      todoItemsList.map(eachItem => ({
        id: eachItem.id,
        todo: eachItem.todo,
        priority: eachItem.priority,
        status: eachItem.status,
        category: eachItem.category,
        dueDate: eachItem.due_date,
      })),
    )
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

//Add TodoItem
app.post('/todos/', async (request, response) => {
  const todoItemDetails = request.body
  const {id, todo, priority, status, category, dueDate} = todoItemDetails
  const givenDueDate = new Date(dueDate)
  const formattedDueDate = format(givenDueDate, 'yyyy-MM-dd')

  if (todoPriority.find(item => item === priority) === undefined) {
    response.status(400)
    response.send('Invalid Todo Priority')
  } else if (todoStatus.find(item => item === status) === undefined) {
    response.status(400)
    response.send('Invalid Todo Status')
  } else if (todoCategory.find(item => item === category) === undefined) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else if (
    givenDueDate === undefined ||
    isValid(new Date(formattedDueDate)) === false
  ) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    const addTodoItemQuery = `
    INSERT INTO todo(
      id, todo, priority, status, category, due_date
    )
    VALUES (
      ${id},
      '${todo}',
      '${priority}',
      '${status}',
      '${category}',
      '${formattedDueDate}'
    );
  `

    await db.run(addTodoItemQuery)
    response.send('Todo Successfully Added')
  }
})

// Update Todo Item
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const getExistingTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id=${todoId};
  `

  const existingTodo = await db.get(getExistingTodoQuery)
  console.log(existingTodo.status)

  const {
    id = existingTodo.id,
    todo = existingTodo.todo,
    priority = existingTodo.priority,
    status = existingTodo.status,
    category = existingTodo.category,
    dueDate = existingTodo.due_date,
  } = request.body

  console.log(request.body)

  const updatedDueDate = new Date(dueDate)
  const newDueDate = format(updatedDueDate, 'yyyy-MM-dd')

  if (todoPriority.find(item => item === priority) === undefined) {
    response.status(400)
    response.send('Invalid Todo Priority')
  } else if (todoStatus.find(item => item === status) === undefined) {
    response.status(400)
    response.send('Invalid Todo Status')
  } else if (todoCategory.find(item => item === category) === undefined) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else if (isValid(new Date(formattedDate)) === false) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    const updateTodoQuery = `
    UPDATE
      todo
    SET
      id=${id},
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}',
      due_date='${newDueDate}'
    WHERE
      id=${todoId};
  `

    await db.run(updateTodoQuery)
  }

  const updatedTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id=${todoId};
  `

  const updatedTodo = await db.get(updatedTodoQuery)
  console.log(updatedTodo.status)

  if (updatedTodo.status !== existingTodo.status) {
    response.send('Status Updated')
  } else if (updatedTodo.priority !== existingTodo.priority) {
    response.send('Priority Updated')
  } else if (updatedTodo.todo !== existingTodo.todo) {
    response.send('Todo Updated')
  } else if (updatedTodo.category !== existingTodo.category) {
    response.send('Category Updated')
  } else {
    response.send('Due Date Updated')
  }
})

// Delete Todo
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const deleteTodoQuery = `
    DELETE FROM
      todo
    WHERE
      id=${todoId};
  `
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app

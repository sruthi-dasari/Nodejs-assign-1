var format = require("date-fns/format");
var isValid = require("date-fns/isValid");

const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

let invalid_column = "";

const validStatus = (status) => {
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    return true;
  } else {
    invalid_column = "Todo Status";
    return false;
  }
};

const validPriority = (priority) => {
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    return true;
  } else {
    invalid_column = "Todo Priority";
    return false;
  }
};

const validCategory = (category) => {
  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    return true;
  } else {
    invalid_column = "Todo Category";
    return false;
  }
};

const validDueDate = (dateObj) => {
  let result = isValid(dateObj);
  if (result === true) {
    return true;
  } else {
    invalid_column = "Due Date";
    return false;
  }
};

const validPriorityAndStatus = (priority, status) => {
  if (validPriority(priority) === true) {
    if (validStatus(status) === true) {
      return true;
    } else {
      invalid_column = "Status";
      return false;
    }
  } else {
    invalid_column = "Priority";
    return false;
  }
};

const validCategoryAndStatus = (priority, status) => {
  if (validCategory(category) === true) {
    if (validStatus(status) === true) {
      return true;
    } else {
      invalid_column = "Status";
      return false;
    }
  } else {
    invalid_column = "Category";
    return false;
  }
};

const validCategoryAndPriority = (priority, category) => {
  if (validCategory(category) === true) {
    if (validPriority(priority) === true) {
      return true;
    } else {
      invalid_column = "Priority";
      return false;
    }
  } else {
    invalid_column = "Category";
    return false;
  }
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

//API 1

const convertDbObjToResObj = (dbObj) => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    priority: dbObj.priority,
    status: dbObj.status,
    category: dbObj.category,
    dueDate: dbObj.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;
  let validValuesEntered;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (validPriorityAndStatus(priority, status) === true) {
        getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}'
                AND status = '${status}';`;
        validValuesEntered = true;
      } else {
        validValuesEntered = false;
      }
      break;
    case hasStatusProperty(request.query):
      if (validStatus(status) === true) {
        getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}';`;
        validValuesEntered = true;
      } else {
        validValuesEntered = false;
      }
      break;
    case hasPriorityProperty(request.query):
      if (validPriority(priority) === true) {
        getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}'`;
        validValuesEntered = true;
      } else {
        validValuesEntered = false;
      }
      break;
    case hasCategoryAndStatusProperties(request.query):
      if (validCategoryAndStatus(category, status) === true) {
        getTodosQuery = `
                    SELECT
                        *
                    FROM 
                        todo
                    WHERE
                        todo LIKE '%${search_q}%'
                        AND category = '${category}'
                        AND status = '${status}';`;
        validValuesEntered = true;
      } else {
        validValuesEntered = false;
      }
      break;
    case hasCategoryProperty(request.query):
      if (validCategory(category) === true) {
        getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND category = '${category}';`;
        validValuesEntered = true;
      } else {
        validValuesEntered = false;
      }

      break;
    case hasCategoryAndPriorityProperties(request.query):
      if (validCategoryAndPriority(category, priority) === true) {
        getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}'
                AND category = '${category}';`;

        validValuesEntered = true;
      } else {
        validValuesEntered = false;
      }
      break;
    default:
      getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'`;
      validValuesEntered = true;
      break;
  }

  if (validValuesEntered === true) {
    const data = await db.all(getTodosQuery);
    const RespObjArr = data.map((eachList) => convertDbObjToResObj(eachList));
    response.send(RespObjArr);
  } else {
    response.status(400);
    response.send(`Invalid ${invalid_column}`);
  }
});

//API 2

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT * FROM todo WHERE id = '${todoId}';`;

  const todo = await db.get(getTodoQuery);
  const respObj = convertDbObjToResObj(todo);
  response.send(respObj);
});

//API 3

app.get("/agenda/", async (request, response) => {
  let { date } = request.query;
  const dateObj = new Date(date);

  if (validDueDate(dateObj)) {
    const newDate = format(dateObj, "yyyy-MM-dd");

    const getTodoOfDateQuery = `
    SELECT * FROM todo WHERE due_date = '${newDate}';`;

    const dateTodo = await db.all(getTodoOfDateQuery);
    if (dateTodo !== undefined) {
      //   console.log(dateObj);
      const respTodoObjArr = dateTodo.map((eachTodo) =>
        convertDbObjToResObj(eachTodo)
      );
      response.send(respTodoObjArr);
    } else {
      response.status(400);
      response.send("No records for this date");
    }
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4

app.post("/todos", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  let postTodoQuery = "";
  let validValuesEntered;

  const dateObj = new Date(dueDate);

  if (validStatus(status) === true) {
    if (validPriority(priority) === true) {
      if (validCategory(category) === true) {
        if (validDueDate(dateObj)) {
          validValuesEntered = true;
        } else {
          validValuesEntered = false;
        }
      } else {
        validValuesEntered = false;
      }
    } else {
      validValuesEntered = false;
    }
  } else {
    validValuesEntered = false;
  }

  if (validValuesEntered === true) {
    const date = format(new Date(dueDate), "yyyy-MM-dd");
    const postTodoQuery = `
    INSERT INTO 
        todo(id, todo, priority, status, category, due_date)
    VALUES
        (
            '${id}',
            '${todo}',
            '${priority}',
            '${status}',
            '${category}',
            '${date}'
        );`;

    await db.run(postTodoQuery);
    response.send("Todo Successfully Added");
  } else {
    response.status(400);
    response.send(`Invalid ${invalid_column}`);
  }
});

//API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  const { status, priority, category, dueDate } = request.body;

  const dateObj = new Date(dueDate);

  switch (true) {
    case requestBody.status !== undefined:
      if (validStatus(status) === true) {
        updateColumn = "Status";
        validValuesEntered = true;
      } else {
        validValuesEntered = false;
      }
      break;

    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      validValuesEntered = true;
      break;

    case requestBody.priority !== undefined:
      if (validPriority(priority) === true) {
        updateColumn = "Priority";
        validValuesEntered = true;
      } else {
        validValuesEntered = false;
      }
      break;

    case requestBody.category !== undefined:
      if (validCategory(category) === true) {
        updateColumn = "Category";
        validValuesEntered = true;
      } else {
        validValuesEntered = false;
      }
      break;
    case requestBody.dueDate !== undefined:
      if (validDueDate(dateObj) === true) {
        updateColumn = "Due Date";
        validValuesEntered = true;
      } else {
        validValuesEntered = false;
      }
      break;
  }

  if (validValuesEntered === true) {
    const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;

    const previousTodo = await db.get(previousTodoQuery);

    const {
      todo = previousTodo.todo,
      priority = previousTodo.priority,
      status = previousTodo.status,
      category = previousTodo.category,
      dueDate = previousTodo.due_date,
    } = request.body;

    const updateTodoQuery = `
    UPDATE
        todo
    SET 
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}',
        category = '${category}',
        due_date = '${dueDate}'
    WHERE 
        id = ${todoId};`;

    await db.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
  } else {
    response.status(400);
    response.send(`Invalid ${invalid_column}`);
  }
});

//API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `
    DELETE FROM 
        todo
    WHERE 
        id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

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
    db = open({
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

//API 1

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority === undefined && requestQuery.status === undefined
  );
};

app.get("/todos/", async (request, response) => {
  let data = null;
  const getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                search_q LIKE '%${search_q}%'
                AND priority = '${priority}'
                AND status = '${status}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                search_q LIKE '%${search_q}%'
                AND status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                search_q LIKE '%${search_q}%'
                AND priority = '${priority}'`;
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                search_q LIKE '%${search_q}%'
                AND category = '${category}'
                AND status = '${status}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                search_q LIKE '%${search_q}%'
                AND category = '${category}';`;
      break;
    case hasCategoryAndPriorityProperties(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                search_q LIKE '%${search_q}%'
                AND priority = '${priority}'
                AND category = '${category}';`;
      break;
    default:
      getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                search_q LIKE '%${search_q}%'`;
      break;
  }

  data = await db.get(getTodosQuery);
  response.send(data);
});

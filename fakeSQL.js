class QueryBuilder {
  constructor() {
    this.columns = [];
    this.tables = "";
    this.conditions = [];
  }

  select(...columns) {
    this.columns = columns;
    return this;
  }

  from(tables) {
    this.tables = tables;
    return this;
  }

  where(conditions) {
    this.conditions = conditions;
    return this;
  }

  execute() {
    let query = `SELECT ${this.columns.join(", ")} FROM ${this.tables}`;
    if (this.conditions && this.conditions.length > 0) {
      query += ` WHERE ${this.conditions.join(" AND ")}`;
    }

    console.log("execute", query);

    return query;
  }
}

// Usage example
// const query = new QueryBuilder()
//   .select("column1", "column2", "column3")
//   .from("table2")
//   .where(["column1 = 10", "column2 > 20", "column3 < 30"])
//   .execute();

// console.log(query);

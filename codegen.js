try { // first-line
console.log("..:: START ::..");
/* Query Begins */
const query = new QueryBuilder();
const result = query.select("column1")
	.from("table2")
	.where(["i < 0"])
	.execute();

/* line: 0 */} catch (e) {
debugger;
const err = new Error(e.message);
throw err;
}
//# sourceMappingURL=codegen.js.map
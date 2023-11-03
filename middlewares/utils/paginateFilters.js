export const paginate = (req, users) => {
  if (!req.query.page && !req.query.limit) return users;

  if (users.length == 0) return users;

  let usersList = [...users];

  const pageQuery = req.query.page;
  const limitQuery = req.query.limit;
  const page = pageQuery * 1 || 1;
  const limit = limitQuery * 1 || 1;
  const skip = (page - 1) * limit;
  console.log(page, limit, skip);

  usersList = usersList.splice(skip, limit);

  return usersList;
};

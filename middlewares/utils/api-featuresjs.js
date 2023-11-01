export class ApiFeatures {
  constructor(prismaQuery, queryString) {
    this.prismaQuery = prismaQuery;
    this.queryString = queryString;
  }

  async paginate() {
    this.prismaQuery = await this.prismaQuery;
    if (!this.queryString.page && !this.queryString.limit) return this;

    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 1;
    const skip = (page - 1) * limit;
    console.log(page, limit, skip);

    this.prismaQuery = this.prismaQuery.splice(skip, limit);

    return this;
  }
}

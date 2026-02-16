export abstract class Repository<T> {
  constructor(protected readonly dataSource: T) {}
}

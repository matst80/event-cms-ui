export class Observable {
  _next: Observable[] = [];
  input: any;
  output: any;
  transformer: (any) => any;
  constructor(transformFunction: (any) => any = (_) => _) {
    this.transformer = transformFunction;
  }
  emit(data: any) {
    if (this.input !== data) {
      this.input = data;
      this.onChange();
    }
  }
  handleOutput(data: any) {
    if (data != this.output) {
      this.output = data;
      this._next.forEach((next) => {
        next.emit(this.output);
      });
    }
  }
  onChange() {
    const result = this.transformer(this.input);
    if (result instanceof Promise) {
      result.then((o) => {
        this.handleOutput(o);
      });
    } else {
      this.handleOutput(result);
    }
  }
  pipe(...next: Observable[]) {
    let t: Observable = this;
    next.forEach((n) => {
      t._next.push(n);
      t = n;
    });
    return t;
  }
  subscribe(fn) {
    this._next.push(new Observable(fn));
  }
}

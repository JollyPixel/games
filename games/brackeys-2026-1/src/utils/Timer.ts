export class Timer {
  #duration: number;
  #startTime: number = -Infinity;

  constructor(duration: number) {
    this.#duration = duration;
  }

  get ready(): boolean {
    return performance.now() - this.#startTime >= this.#duration;
  }

  start(): void {
    this.#startTime = performance.now();
  }

  reset(): void {
    this.#startTime = -Infinity;
  }
}

#!/usr/bin/env python3
"""Generate Fibonacci numbers as fast as possible for 1 second."""

import time
import sys

sys.set_int_max_str_digits(0)

def fibonacci_generator():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

def main():
    start = time.perf_counter()
    end_time = start + 1.0
    count = 0
    last_fib = 0

    gen = fibonacci_generator()
    while time.perf_counter() < end_time:
        last_fib = next(gen)
        count += 1

    elapsed = time.perf_counter() - start
    print(f"Generated {count:,} Fibonacci numbers in {elapsed:.4f} seconds")
    print(f"Last number had {len(str(last_fib)):,} digits")

if __name__ == "__main__":
    main()

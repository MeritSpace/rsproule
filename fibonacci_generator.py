#!/usr/bin/env python3
import time
import sys

def generate_fibonacci_fast():
    """Generate Fibonacci numbers as fast as possible for 1 second"""
    # Increase limit for large integer string conversion
    sys.set_int_max_str_digits(50000)

    start_time = time.time()
    count = 0

    # Use variables instead of list for maximum speed
    a, b = 0, 1

    print("Generating Fibonacci numbers for 1 second...")
    count = 0

    while time.time() - start_time < 1.0:
        a, b = b, a + b
        count += 1

    print(f"\nGenerated {count:,} Fibonacci numbers in 1 second")

    # Calculate digits without converting to string (more efficient)
    import math
    if b > 0:
        digits = int(math.log10(b)) + 1
    else:
        digits = 1

    print(f"Last number has approximately {digits:,} digits")
    print(f"First 50 digits: {str(b)[:50]}...")

if __name__ == "__main__":
    generate_fibonacci_fast()
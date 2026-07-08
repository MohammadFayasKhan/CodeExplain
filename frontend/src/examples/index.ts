/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Collection of pre-loaded mock code snippets across multiple languages.
 *
 * Example snippets shown as chips above the empty input card so the landing
 * demo works without the user needing their own code ready.
 */

export interface ExampleSnippet {
  id: string;
  label: string;
  language: string;
  code: string;
}

export const EXAMPLES: ExampleSnippet[] = [
  {
    id: 'py-twosum',
    label: 'Two Sum (Python)',
    language: 'python',
    code: `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
    return []`,
  },
  {
    id: 'cpp-prime',
    label: 'Is Prime? (C++)',
    language: 'cpp',
    code: `#include <iostream>

bool isPrime(int n) {
    if (n <= 1) return false;
    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}`,
  },
  {
    id: 'py-fib',
    label: 'Recursive Fibonacci (Python)',
    language: 'python',
    code: `def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(10))`,
  },
  {
    id: 'js-reduce',
    label: 'Array reduce (JavaScript)',
    language: 'javascript',
    code: `const arr = [1, 2, 3, 4, 5];
const sum = arr.reduce((acc, n) => acc + n, 0);
console.log(sum);`,
  },
  {
    id: 'c-binarysearch',
    label: 'Binary Search (C)',
    language: 'c',
    code: `#include <stdio.h>

int binarySearch(int arr[], int size, int target) {
    int left = 0;
    int right = size - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
  },
  {
    id: 'js-debounce',
    label: 'Debounce fn (JavaScript)',
    language: 'javascript',
    code: `function debounce(fn, wait) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}`,
  },
];

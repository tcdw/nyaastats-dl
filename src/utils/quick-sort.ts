/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */

export interface KeyValue {
    key: string;
    value: number;
}

const swap = (arr: KeyValue[], i: number, j: number) => {
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
};

const partition = (arr: KeyValue[], left: number, right: number) => {
    const pivot = left;
    let index = pivot + 1;
    for (let i = index; i <= right; i++) {
        if (arr[i].value < arr[pivot].value) {
            swap(arr, i, index);
            index += 1;
        }
    }
    swap(arr, pivot, index - 1);
    return index - 1;
};

export function quickSort(arr: KeyValue[], left?: number, right?: number) {
    const len = arr.length;
    let partitionIndex;
    left = typeof left !== 'number' ? 0 : left;
    right = typeof right !== 'number' ? len - 1 : right;

    if (left < right) {
        partitionIndex = partition(arr, left, right);
        quickSort(arr, left, partitionIndex - 1);
        quickSort(arr, partitionIndex + 1, right);
    }
    return arr;
}

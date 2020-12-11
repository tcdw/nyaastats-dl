/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */

const swap = (arr: any[], i: number, j: number) => {
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
};

const partition = (arr: any[], key: string, desc: boolean, left: number, right: number) => {
    const pivot = left;
    let index = pivot + 1;
    for (let i = index; i <= right; i++) {
        if (desc) {
            if (arr[i][key] > arr[pivot][key]) {
                swap(arr, i, index);
                index += 1;
            }
        } else if (arr[i][key] < arr[pivot][key]) {
            swap(arr, i, index);
            index += 1;
        }
    }
    swap(arr, pivot, index - 1);
    return index - 1;
};

function quickSort(arr: any[], key: string, desc: boolean, left?: number, right?: number) {
    const len = arr.length;
    let partitionIndex;
    left = typeof left !== 'number' ? 0 : left;
    right = typeof right !== 'number' ? len - 1 : right;

    if (left < right) {
        partitionIndex = partition(arr, key, desc, left, right);
        quickSort(arr, key, desc, left, partitionIndex - 1);
        quickSort(arr, key, desc, partitionIndex + 1, right);
    }
    return arr;
}

export default quickSort;

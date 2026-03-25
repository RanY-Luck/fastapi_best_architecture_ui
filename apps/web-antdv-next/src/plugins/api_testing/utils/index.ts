import type { PageResult } from '../api/types';

import type { LocationQueryValue } from 'vue-router';

type RecordValue = boolean | number | string | undefined;
type UnknownRecord = Record<string, unknown>;

export function filterEmptyParams<T extends UnknownRecord>(params: T): Partial<T> {
  return Object.entries(params).reduce<Partial<T>>((acc, [key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      acc[key as keyof T] = value as T[keyof T];
    }
    return acc;
  }, {});
}

export function buildLocalPageResult<T>(
  items: T[],
  page: number,
  size: number,
): PageResult<T> {
  const currentPage = Math.max(page, 1);
  const pageSize = Math.max(size, 1);
  const start = (currentPage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: currentPage,
    size: pageSize,
    total: items.length,
  };
}

export function getRouteQueryNumber(
  value?: LocationQueryValue | LocationQueryValue[],
) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    return undefined;
  }

  const parsedValue = Number(rawValue);
  return Number.isNaN(parsedValue) ? undefined : parsedValue;
}

export function parseJsonInput<T = unknown>(value: unknown): T | undefined {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return value as T;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

export function parseJsonInputOrRaw<T = unknown>(
  value: unknown,
): T | string | undefined {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return value as T;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return value;
  }
}

export function stringifyJsonInput(value: unknown): RecordValue {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return value as RecordValue;
}

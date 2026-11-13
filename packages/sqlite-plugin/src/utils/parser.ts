export const parseCompanyScale = (str: string): [number| null, number | null] => {
  if (!str) {
    return [null, null]
  }

  const betweenRangeMatchResult = str.match(
    /(\d+)-(\d+)人/
  );
  if (betweenRangeMatchResult) {
    const arr = [...betweenRangeMatchResult];
    arr.shift();
    return arr.map(Number) as [number, number]
  }

  const gtRangeMatchResult = str.match(
    /(\d+)人以上/
  );
  if (gtRangeMatchResult) {
    const arr = [...gtRangeMatchResult];
    arr.shift();
    return [Number(arr[0]), null]
  }

  return [null, null]
}

export function formatCompanyScale(low, high) {
  if (low === null && high === null) {
    return ''
  }
  if (low === null && high !== null) {
    return `${high}人以下`
  }
  if (low !== null && high === null) {
    return `${low}人以上`
  }
  return `${low}-${high}人`
}

const STATUTORY_MONTHLY_WORK_DAYS = 21.75;

const roundTo2Decimals = (n: number) => Math.round(n * 100) / 100;

export const parseSalary = (str: string): { low: null | number, high: null | number, month: null | number } => {
  const result: { low: null | number, high: null | number, month: null | number } = {
    high: null,
    low: null,
    month: null
  }
  if (!str) {
    return result
  }

  const dailyMatchResult = str.match(
    /([\.\d]+)(?:\s*[-~～至]\s*([\.\d]+))?\s*(k)?\s*元?\s*[/／]\s*[天日]/i
  );
  if (dailyMatchResult) {
    const multiplier = dailyMatchResult[3] ? 1000 : 1;
    const rawLow = Number(dailyMatchResult[1]) * multiplier;
    const rawHigh = dailyMatchResult[2] !== undefined ? Number(dailyMatchResult[2]) * multiplier : rawLow;
    if (Number.isFinite(rawLow) && Number.isFinite(rawHigh)) {
      const lowK = roundTo2Decimals((Math.min(rawLow, rawHigh) * STATUTORY_MONTHLY_WORK_DAYS) / 1000);
      const highK = roundTo2Decimals((Math.max(rawLow, rawHigh) * STATUTORY_MONTHLY_WORK_DAYS) / 1000);
      result.low = lowK;
      result.high = highK;
    }
    return result;
  }

  const baseMatchResult = str.match(
    /([\.\d]+)-([\.\d]+)k/i
  );
  if (baseMatchResult) {
    const arr = [...baseMatchResult];
    arr.shift();
    Object.assign(
      result,
      {
        low: Number(arr[0]),
        high: Number(arr[1]),
      }
    )
  }

  const month = str.match(
    /([\.\d]+)薪/
  )
  if (month) {
    const arr = [...month];
    arr.shift();
    Object.assign(
      result,
      {
        month: Number(arr[0])
      }
    )
  }

  return result
}

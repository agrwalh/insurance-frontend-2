import { useState, useEffect, useCallback } from "react";
import { getApiErrorMessage } from "../utils/apiResponse";

export function useFetch(fetchFn, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refetch = useCallback(() => {
    setLoading(true);
    setError("");

    fetchFn()
      .then((response) => {
        setData(response.data.data);
      })
      .catch((err) => {
        setError(getApiErrorMessage(err, "Something went wrong while loading data."));
      })
      .finally(() => {
        setLoading(false);
      });
  }, dependencies);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

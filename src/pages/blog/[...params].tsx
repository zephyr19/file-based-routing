import { useRouter } from "../../../utils/router";

export default function BlogCatchAllRoutes() {
  const { query } = useRouter();
  return (
    <>
      <h1>BlogCatchAllRoutes: {JSON.stringify(query.params)}</h1>
    </>
  );
}

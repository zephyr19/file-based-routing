import { useRouter } from "../../../utils/router";

export default function BlogOptionalCatchAllRoutes() {
  const { query } = useRouter();
  return (
    <>
      <h1>BlogOptionalCatchAllRoutes: {query.params}</h1>
    </>
  );
}

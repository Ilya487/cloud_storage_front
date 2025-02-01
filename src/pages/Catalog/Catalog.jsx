import { useParams } from "react-router";
import { useFolderContent } from "../../API/fileSystemService";
import CatalogItem from "../../Components/CatalogItem/CatalogItem";

const Catalog = () => {
  const { dirId } = useParams();
  const { data, isPending } = useFolderContent(dirId);

  if (isPending) return <p>Загрузка...</p>;
  else
    return (
      <section>
        {data.contents.length > 0 &&
          data.contents.map((item) => (
            <CatalogItem key={item.id} catalogItem={item} />
          ))}

        {data.contents.length == 0 && <p>{"тут ничего нет"}</p>}
      </section>
    );
};

export default Catalog;

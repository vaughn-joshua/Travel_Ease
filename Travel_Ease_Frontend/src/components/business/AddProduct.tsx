import { useEffect, useState } from "react";
import { useForm, FieldValues } from "react-hook-form";
import { fetch_categories } from "../../utils/business/fetch_categories";
import { create_range } from "../../utils/business/create_range";
import { upload_images } from "../../utils/business/upload_images";

interface Category {
  category_id: number;
  category_name: string;
}

interface AddProductProps {
  on_close: () => void;
  id: string | number;
}

function AddProduct({ on_close, id }: AddProductProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [categroies, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const load_data = async () => {
      try {
        const get_categories = await fetch_categories(String(id));
        console.log(get_categories);
        setCategories(get_categories || []);
      } catch (error) {
        console.log(error);
      }
    };

    load_data();
  }, [id]);

  const handle_close = () => {
    on_close();
  };

  const on_submit = async (data: FieldValues) => {
    const form_data = new FormData();
    const menuFiles = data.menu as FileList;

    for (let i = 0; i < menuFiles.length; i++) {
      form_data.append("images", menuFiles[i]);
      form_data.append("names", `${id}_${i}`);
      form_data.append("folders", `Travel_Ease/Business/Menu`);
    }

    const upload = await upload_images(form_data);

    data.pictures = upload;
    data.id = id;

    console.log({ data });

    await create_range(data);
    on_close();
  };

  return (
    <div className="modal">
      <div className="modal_body w-[60vw]">
        <div className="flex justify-between">
          <h1 className="text-xl font-bold">Complete Business Details</h1>
          <button className="soft_btn" onClick={handle_close}>
            close
          </button>
        </div>

        <form onSubmit={handleSubmit(on_submit)}>
          <label className="label">
            Menu:
            <input
              {...register("menu", {
                required: "name is required",
              })}
              type="file"
              className="text_box"
              multiple
            />
          </label>
          {errors.menu && <p>{errors.menu.message as string}</p>}

          {categroies.map((category, index) => (
            <div key={index}>
              <label className="label">
                {category.category_name} Price Range:
                <div className="flex gap-3">
                  <input
                    {...register(`categories.${index}.min_price`, {
                      min: 1,
                    })}
                    className="text_box"
                    type="number"
                    placeholder="enter minimum price"
                  />
                  <input
                    {...register(`categories.${index}.max_price`, {
                      min: 1,
                    })}
                    className="text_box"
                    type="number"
                    placeholder="enter maximum price"
                  />
                  <input
                    type="hidden"
                    {...register(`categories.${index}.category_name`)}
                    value={category.category_name}
                  />
                  <input
                    type="hidden"
                    {...register(`categories.${index}.category_id`)}
                    value={category.category_id}
                  />
                </div>
              </label>
              {errors.category && <p>{(errors.category as any).message}</p>}
            </div>
          ))}

          <input type="submit" value="Submit" className="hard_btn mt-3" />
        </form>
      </div>
    </div>
  );
}

export default AddProduct;

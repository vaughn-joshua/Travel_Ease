import { useState } from "react";
import { useForm, FieldValues } from "react-hook-form";
import { useBusinessCategoriesById } from "../../features/businesses/queries";
import { useCreatePriceRange } from "../../features/businesses/mutations";
import { upload_images } from "../../utils/business/upload_images";

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories for this business using TanStack Query
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useBusinessCategoriesById(id);

  // Mutation for creating price ranges
  const createPriceRangeMutation = useCreatePriceRange();

  const handle_close = () => {
    on_close();
  };

  const on_submit = async (data: FieldValues) => {
    setIsSubmitting(true);
    try {
      const form_data = new FormData();
      const menuFiles = data.menu as FileList;

      for (let i = 0; i < menuFiles.length; i++) {
        form_data.append("images", menuFiles[i]);
        form_data.append("names", `${id}_${i}`);
        form_data.append("folders", `Travel_Ease/Business/Menu`);
      }

      const upload = await upload_images(form_data);

      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      const payload = {
        ...data,
        pictures: upload,
        id: numericId,
        business_id: numericId,
      };

      console.log({ payload });

      // Use mutation to create price ranges
      await createPriceRangeMutation.mutateAsync(payload);
      on_close();
    } catch (error) {
      console.error("Failed to submit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (categoriesLoading) {
    return (
      <div className="modal">
        <div className="modal_body w-[60vw]">
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="modal">
        <div className="modal_body w-[60vw]">
          <p className="text-red-500">Failed to load categories: {categoriesError.message}</p>
          <button className="soft_btn" onClick={handle_close}>
            close
          </button>
        </div>
      </div>
    );
  }

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

          {categories.map((category, index) => (
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

          <input
            type="submit"
            value={isSubmitting || createPriceRangeMutation.isPending ? "Submitting..." : "Submit"}
            className="hard_btn mt-3"
            disabled={isSubmitting || createPriceRangeMutation.isPending}
          />
        </form>
      </div>
    </div>
  );
}

export default AddProduct;

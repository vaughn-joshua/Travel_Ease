import { useState } from "react";
import { useForm, FieldValues } from "react-hook-form";
import { useUpdateBusiness } from "../../features/businesses/mutations";
import { upload_images } from "../../utils/business/upload_images";

interface AddProductProps {
  on_close: () => void;
  id: string | number;
}

/**
 * Component to add menu images and set price range for a business.
 * Price range is now stored directly on the business (min_price, max_price).
 */
function AddProduct({ on_close, id }: AddProductProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mutation for updating business (includes price range)
  const updateBusinessMutation = useUpdateBusiness();

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
      
      // Build payload with min/max price on business level
      const payload: Record<string, any> = {
        picture: upload,
      };

      // Add price range if provided (business-level fields)
      if (data.min_price) {
        payload.min_price = parseInt(data.min_price, 10);
      }
      if (data.max_price) {
        payload.max_price = parseInt(data.max_price, 10);
      }

      console.log({ payload });

      // Use mutation to update business with price range
      await updateBusinessMutation.mutateAsync({
        id: String(numericId),
        data: payload,
      });
      on_close();
    } catch (error) {
      console.error("Failed to submit:", error);
    } finally {
      setIsSubmitting(false);
    }
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
                required: "menu images are required",
              })}
              type="file"
              className="text_box"
              multiple
            />
          </label>
          {errors.menu && <p className="text-red-500">{errors.menu.message as string}</p>}

          {/* Price range now applies to the entire business, not per category */}
          <div className="mt-4">
            <label className="label">
              Business Price Range:
              <div className="flex gap-3 mt-2">
                <input
                  {...register("min_price", {
                    min: { value: 0, message: "Minimum price must be at least 0" },
                  })}
                  className="text_box"
                  type="number"
                  placeholder="Minimum price"
                />
                <input
                  {...register("max_price", {
                    min: { value: 0, message: "Maximum price must be at least 0" },
                  })}
                  className="text_box"
                  type="number"
                  placeholder="Maximum price"
                />
              </div>
            </label>
            {errors.min_price && <p className="text-red-500">{(errors.min_price as any).message}</p>}
            {errors.max_price && <p className="text-red-500">{(errors.max_price as any).message}</p>}
          </div>

          <input
            type="submit"
            value={isSubmitting || updateBusinessMutation.isPending ? "Submitting..." : "Submit"}
            className="hard_btn mt-3"
            disabled={isSubmitting || updateBusinessMutation.isPending}
          />
        </form>
      </div>
    </div>
  );
}

export default AddProduct;

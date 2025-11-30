import { useState } from "react";
import { upload_images } from "../../utils/business/upload_images";
import { create_range } from "../../utils/business/create_range";

interface AddProductProps {
  on_close: () => void;
  id: string;
}

export default function Add_Product({ on_close, id }: AddProductProps): React.ReactElement {
  const [files, setFiles] = useState<FileList | null>(null);
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload images if selected
      if (files && files.length > 0) {
        await upload_images(files);
      }

      // Create price range
      if (priceMin && priceMax) {
        await create_range({
          business_id: id,
          min: parseFloat(priceMin),
          max: parseFloat(priceMax),
        });
      }

      on_close();
    } catch (e) {
      console.error("Error adding product:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal_body">
        <h1 className="text-xl font-semibold text-red-600 text-center mb-4">
          Add Business Details
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Menu Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="text_box"
            />
            {files && (
              <p className="text-sm text-gray-600 mt-1">
                {files.length} file(s) selected
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Minimum Price</label>
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="text_box"
                placeholder="₱0"
              />
            </div>
            <div>
              <label className="label">Maximum Price</label>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="text_box"
                placeholder="₱1000"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={on_close} className="soft_btn">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="hard_btn disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


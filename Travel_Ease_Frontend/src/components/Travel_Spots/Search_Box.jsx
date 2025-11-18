import React from "react";
import { useForm } from "react-hook-form";

function search_box(){

   const { register, handleSubmit, watch, formState: { errors }, } = useForm();
   const fromValue = watch("from"); 
   const onSubmit = (data) => {
    console.log(data);
    alert(`Budget range: ₱${data.from} - ₱${data.to}`);
   }
    return(
        <>
        <div className = "flex flex-col bg-[#FFFFFF] shadow-md rounded-lg m-4 p-4">
            <div className="search-box-container border border-gray-300 rounded-lg m-4 flex flex-row gap-2 p-5">
                <input type="text" className="search-box-input w-[90%]" placeholder="Search for travel spots..." />
                <input type = "submit" className="search-box-button w-[10%] border border-gray-300 rounded-sm bg-[#dbdbdb] hover:bg-[#c0c0c0]" value = "Search" />
            </div>
            <div className = "category-container flex flex-row gap-4 text-sm mx-6">
                <div className = "px-4 bg-[#dbdbdb] hover:bg-[#c0c0c0] border-gray-400 rounded-lg">Food</div>
                <div className = "px-4 bg-[#dbdbdb] hover:bg-[#c0c0c0] border-gray-400 rounded-lg">Drinks</div>
                <div className = "px-4 bg-[#dbdbdb] hover:bg-[#c0c0c0] border-gray-400 rounded-lg">Accomodation</div>
                <div className = "px-4 bg-[#dbdbdb] hover:bg-[#c0c0c0] border-gray-400 rounded-lg">Souvenir Shop</div>
                <div className = "px-4 bg-[#dbdbdb] hover:bg-[#c0c0c0] border-gray-400 rounded-lg">Nature</div>
                <div className = "px-4 bg-[#dbdbdb] hover:bg-[#c0c0c0] border-gray-400 rounded-lg">Night Life</div>
                <div className = "px-4 bg-[#dbdbdb] hover:bg-[#c0c0c0] border-gray-400 rounded-lg">Leisure</div>
                <div className = "px-4 bg-[#dbdbdb] hover:bg-[#c0c0c0] border-gray-400 rounded-lg">Activities</div>
                <div className = "px-4 bg-[#dbdbdb] hover:bg-[#c0c0c0] border-gray-400 rounded-lg">Local Offers</div> 
            </div>
        <form onSubmit = {handleSubmit(onSubmit)} className="space-y-4 p-4 max-w-md flex flex-row gap-4 ">
            <div>
                <label className = "text-xs font-bold">Budget From (₱)</label>
                <input 
                type = "number"
                {...register("from", {
                    required: "Minimum budget is required", 
                    min:  {value: 1, message: "Minimum budget must be at least ₱1"},
                })} className = "border p-2 w-full rounded"
                />
                {errors.form && <p className="text-red-500 text-xs mt-1">{errors.from.message}</p>}
            </div>
                  <div>
        <label className="text-xs font-bold">Budget To (₱)</label>
        <input
          type="number"
          {...register("to", {
            required: "Maximum budget is required",
            validate: (value) =>
              Number(value) >= Number(fromValue) ||
              "Maximum must be greater than or equal to minimum",
          })}
          className="border p-2 w-full rounded"
        />
        {errors.to && <p className="text-red-500">{errors.to.message}</p>}
      </div>


      <button
        type="submit"
        className="bg-[#dbdbdb] text-black rounded w-1/2 h-10 mt-6 hover:bg-[#c0c0c0]"
      >
        Submit
      </button>
             
             </form>
        </div>
        </>

    );


}

export default search_box;
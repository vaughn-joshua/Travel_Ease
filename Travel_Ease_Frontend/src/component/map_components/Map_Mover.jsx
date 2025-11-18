import React from "react";
import { useMap } from "react-leaflet";

export const Map_Mover = ({position})=>{
    const map = useMap();


    React.useEffect(()=>{
        if(position) map.setView(position, 15);
    }, [position, map]);

    return null;
}
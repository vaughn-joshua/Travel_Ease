import { useRef } from "react";
import { useMapEvents } from 'react-leaflet';

function MapClickHandler({ onClear }){
    const clickCountRef = useRef(0);
    const timerRef = useRef(null);

    useMapEvents({
        click: ()=> {
            clickCountRef.current += 1;

            clearTimeout(timerRef.current);

            if(clickCountRef.current === 3 ){
                onClear();
                clickCountRef.current = 0; 
            }else {
                timerRef.current = setTimeout(()=> {
                    clickCountRef.current = 0;
                }, 2000)
            }
        }
    })

    return null; 
}
export default MapClickHandler;

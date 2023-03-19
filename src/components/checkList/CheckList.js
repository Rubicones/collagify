import "./CheckList.css"
import SpotifyService from "../services/SpotifyService"
import {ReactComponent as Spinner} from "../../img/spinner.svg"
import { useEffect, useState } from "react"

function ListItem({selectedID, selected, name, id}) {
    return(
        <li className={(selectedID == id) ? "search-item search-item__active" : "search-item"} onClick={selected}>{name}</li>
    )
}

function CheckList(props) {
    let service = new SpotifyService()
    const [items, setItems] = useState([])
    const [playlists, updPlaylists] = useState([])
    const [load, setLoad] = useState(true)
    const [artists, updArtists] = useState([])
    const [totalTracks, setTotalTracks] = useState(null)
    const [selected, setSelected] = useState(0)

    const onItemSelect = (clicked) => {
        setSelected(clicked[0])
        props.newSelect(clicked[0])
    }

    const setItemList = (array) => {
        setItems(array.map(item => <ListItem name={item[1]} key={item[0]} id={item[0]} selectedID={selected} selected={() => onItemSelect(item)}/>))
    }

    useEffect(() => {
        if (!props.loginView){
            if (props.switch == 1){
                if (!artists.length){
                    setLoad(true)
                    service.setFollowedArtists()
                    .then(res => {
                        updArtists(res)
                    })
                }
                setItemList(artists)
            }
            if (props.switch == 2){
                if (!playlists.length){
                    setLoad(true)
                    service.setFollowedPlaylists()
                    .then(res => {
                        updPlaylists(res)
                    })
                } 
                setItemList(playlists)
            }
            if (props.switch == 3){
                if (totalTracks === null){
                    service.getSavedTracks(20, 0).then((res) => setTotalTracks(res.total))
                }
            }
        }
    }, [props])

    useEffect(() => {
        if (props.switch == 1){
            setItemList(artists)
            setLoad(false)
        }
    }, [artists, selected])

    useEffect(() => {
        if (props.switch == 2){
            setItemList(playlists)
            setLoad(false)
        }
    }, [playlists, selected])


    return (
        <div className="choose-search">
            {   props.switch != 3 ?
                <div className="choose-search__container">
                    {load ? 
                    <Spinner/> : 
                    <ul className="choose-search__output">
                        {items}
                    </ul>}
                </div> :
                <div className="wholeLibHeader">
                    Your Whole Library ({totalTracks} track(s))
                </div>
            }
            
        </div>
    );
}


export default CheckList
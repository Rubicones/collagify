import "./App.css";
import Switcher from "../switcher/Switcher";
import CheckList from "../checkList/CheckList";
import SizeSlider from "../sizeSlider/SizeSlider";
import Preview from "../preview/Preview";
import SpotifyService from "../services/SpotifyService";
import { useEffect, useState } from "react";
import spotiLogo from "../../img/spotiLogo.png"
import {ReactComponent as Spinner} from "../../img/spinner.svg"

function App() {
  const [blur, setBlur] = useState({"WebkitFilter": "blur(4px)"})
  const [isloginView, setLoginView] = useState(true)
  const [name, setName] = useState("Your Name")
  const [switcher, setSwitcher] = useState("2")
  const [total, setTotal] = useState(400)
  const [rowsCount, setRowsCount] = useState(20)
  const [colsCount, setColsCount] = useState(20)
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(false)
  let service = new SpotifyService()


  useEffect(() => {
    document.body.style.overflow = "hidden"
    if (window.location.search.length > 0) {
      service.handleRedirect()
      document.body.style.overflow = "scroll"
      setBlur({})
      setLoginView(null)
      service.onPageLoad()
      console.log(1)
    }
    else if (localStorage.getItem("access_token")){
      document.body.style.overflow = "scroll"
      setBlur({})
      setLoginView(null)
      if (service.onPageLoad()){
        service.getName().then(res => setName(res))
      } else {
        setBlur({"WebkitFilter": "blur(4px)"})
        setLoginView(true)
      }
    }
  }, [])

  const onLogin = () => {
      service.requestAuthorization()
  } 

  useEffect(() => {
    if (switcher == 3){
      service.getMySavedTracks(1, 0).then(() => {setColsCount(2); setRowsCount(2)})
      setLoading(true)
      service.setSavedTracks().then(res => {setAlbums(res); return res}).then(res => {setTotal(res.length); setLoading(false)})
    }
  }, [switcher])
  
  const onNewSelect = (id) => {
    if (switcher == 1){
      service.getArtistAlbums(id, 1, 0).then(res => {setColsCount(2); setRowsCount(2)})
      setLoading(true)
      service.setArtistsAlbums(id).then(res => {setAlbums(res); return res}).then(res => {setTotal(res.length); setLoading(false)})
    }
    if (switcher == 2){
      service.getPlaylistAlbums(id, 1, 0).then(res => {setColsCount(2); setRowsCount(2); console.log(res)})
      setLoading(true)
      service.setPlaylistAlbums(id).then(res => {setAlbums(res); return res}).then(res => {setTotal(res.length); setLoading(false)})
    }
    
  }

  return (
    <>
        { isloginView ? <div className="blurredView">
            <div className="modalEnter">
                <span className="greetings">Hello! To create a collage enter <span>Spotify</span>:</span>
                <button className="enterSpoti" onClick={onLogin}>
                    <img src={spotiLogo} alt="Spotify Logo" className="spotiLogo"/>
                </button>
            </div>
        </div> : null}
      <div className="blur" style={blur}>
        <header>
          <div className="subheader-container">
            <div className="subheader-nickname">{name}</div>
          </div>
          <h1>Collagify</h1>
        </header>
        <div className="container">

          <section className="choose-source">
            <h2>Choose what to make a collage from</h2>
            <Switcher onSwitch={(state) => setSwitcher(state)}/>
            <CheckList loginView={isloginView} switch={switcher} newSelect={(id) => onNewSelect(id)}/>
          </section>

          <section className="col-size">
            <SizeSlider onSizeChange={(newRow) => {setRowsCount(+newRow)}} rows={rowsCount} columns={colsCount} total={total} header="Rows"/>
            <SizeSlider onSizeChange={(newCol) => {setColsCount(+newCol)}} rows={rowsCount} columns={colsCount} total={total} header="Columns"/>
          </section>
          {loading ? <Spinner/> : <Preview rows={+rowsCount} cols={+colsCount} albums={albums}/>}
        </div>
      </div>
    </>
  );
}

export default App;

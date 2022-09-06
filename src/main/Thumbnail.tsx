import { css } from "@emotion/react";
import { faCamera, faCopy, faInfoCircle, faTimesCircle, faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { t } from "i18next";
import React from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { settings } from "../config";
import { basicButtonStyle, deactivatedButtonStyle, flexGapReplacementStyle, titleStyle, titleStyleBold } from "../cssStyles";
import { selectTheme, Theme } from "../redux/themeSlice";
import { selectOriginalThumbnails, selectTracks, setHasChanges, setThumbnail, setThumbnails } from "../redux/videoSlice";
import { Track } from "../types";
import Timeline from "./Timeline";
import { VideoControls, VideoPlayers } from "./Video";


/**
 * User interface for handling thumbnails
 */
const Thumbnail : React.FC<{}> = () => {

  const { t } = useTranslation()
  const dispatch = useDispatch()

  const originalThumbnails = useSelector(selectOriginalThumbnails)

  // Generate Refs
  const generateRefs = React.useRef<any>([]);
  // Upload Refs
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Generate image and save in redux
  //   *track: Generate to
  //   *index: Generate from
  const generate = (track: Track, index: number) => {
    const uri = generateRefs.current[index].captureVideo()
    dispatch(setThumbnail({id: track.id, uri: uri}))
    dispatch(setHasChanges(true))
  }

  // Trigger file handler for upload input element
  const upload = (index: number) => {
    // 👇️ open file input box on click of other element
    const ref = inputRefs.current[index]
    if (ref !== null) {
      ref.click();
    }
  };

  // Save uploaded file in redux
  const uploadCallback = (event: React.ChangeEvent<HTMLInputElement>, track: Track) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) {
      return;
    }

    // Check if image
    if (fileObj.type.split('/')[0] !== 'image') {
      return
    }

    var reader  = new FileReader();
    reader.onload = function(e)  {
        // the result image data
        if (e.target && e.target.result) {
          const uri = e.target.result.toString();
          dispatch(setThumbnail({id: track.id, uri: uri}))
          dispatch(setHasChanges(true))
        }
      }
      reader.readAsDataURL(fileObj);
  };

  const discardThumbnail = (id: string) => {
    dispatch(setThumbnail({ id: id, uri: originalThumbnails.find((e: any) => e.id === id)?.uri }))
  }

  const thumbnailStyle = css({
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  })

  return (
    <div css={thumbnailStyle}>
      <div css={[titleStyle, titleStyleBold]}>{t('thumbnail.title')}</div>
      <VideoPlayers refs={generateRefs} widthInPercent={50}/>
      <VideoControls />
      <Timeline timelineHeight={125}/>
      <ThumbnailTable
        inputRefs={inputRefs}
        generate={generate}
        upload={upload}
        uploadCallback={uploadCallback}
        discard={discardThumbnail}
      />
    </div>
  );
}

/**
 * A table for displaying thumbnails and associated actions
 */
const ThumbnailTable : React.FC<{
  inputRefs: any,
  generate: any,
  upload: any,
  uploadCallback: any,
  discard: any,
}> = ({inputRefs, generate, upload, uploadCallback, discard}) => {

  const tracks = useSelector(selectTracks)

  const thumbnailTableStyle = css({
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    ...(flexGapReplacementStyle(10, false)),
  })

  const renderSingleOrMultiple = () => {
    const primaryTrack = tracks.find((e) => e.thumbnailPriority === 0)

    if (settings.thumbnail.simpleMode && primaryTrack !== undefined) {
      return (<>
        <ThumbnailTableSingleRow
          track={primaryTrack}
          index={tracks.indexOf(primaryTrack)}
          inputRefs={inputRefs}
          generate={generate}
          upload={upload}
          uploadCallback={uploadCallback}
          discard={discard}
        />
      </>)
    } else {
      return ( <>
        <AffectAllRow tracks={tracks} generate={generate}/>
        {tracks.map( (track: Track, index: number) => (
          <ThumbnailTableRow
            key={index}
            track={track}
            index={index}
            inputRefs={inputRefs}
            generate={generate}
            upload={upload}
            uploadCallback={uploadCallback}
            discard={discard}
          />
        ))}
      </>)
    }
  }

  return(
    <div css={thumbnailTableStyle}>
      {renderSingleOrMultiple()}
    </div>
  )
}

/**
 * A table entry for a single video+thumbnail pair
 */
const ThumbnailTableRow: React.FC<{
  track: Track,
  index: number,
  inputRefs: any,
  generate: any,
  upload: any,
  uploadCallback: any,
  discard: any,
}> = ({track, index, inputRefs, generate, upload, uploadCallback, discard}) => {

  const { t } = useTranslation()

  const renderPriority = (thumbnailPriority: number) => {
    if (isNaN(thumbnailPriority)) {
      return ""
    } else if (thumbnailPriority === 0) {
      return " - " + t('thumbnail.primary')
    } else if (thumbnailPriority === 1) {
      return " - " + t('thumbnail.secondary')
    } else if (thumbnailPriority < 0) {
      return ""
    } else {
      return " - " + thumbnailPriority
    }
  }

  return (
    <div key={index} css={thumbnailTableRowStyle}>
      <div css={thumbnailTableRowTitleStyle}>
        {track.flavor.type + renderPriority(track.thumbnailPriority)}
      </div>
      <hr css={{width: '100%'}}></hr>
      <div css={thumbnailTableRowRowStyle} key={index}>
        <ThumbnailDisplayer track={track} />
        <ThumbnailButtons
          track={track}
          index={index}
          inputRefs={inputRefs}
          generate={generate}
          upload={upload}
          uploadCallback={uploadCallback}
          discard={discard}/>
      </div>
    </div>
  )
}

/**
 * Displays thumbnail associated with the given track
 * or a placeholder
 */
const ThumbnailDisplayer : React.FC<{track: Track}> = ({track}) => {

  const { t } = useTranslation()

  const generalStyle = css({
    height: '280px',
  })

  const imageStyle = css({
    maxHeight: '100%',
  })

  const placeholderStyle = css({
    backgroundColor: 'grey',
    // For whatever reason, setting the width relative to height is way to difficult,
    // so we hardcode the box size here
    width: '497px',
    // Support for aspectRatio is still spotty and implementations across browsers
    // differ too much
    // aspectRatio: '16/9',

    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  })

  return (
    <>
      {(track.thumbnailUri !== null && track.thumbnailUri !== undefined) ?
        // Thumbnail image
        <img src={track.thumbnailUri}
          alt={t('thumbnail.previewImageAlt') + ": " + track.flavor.type}
          css={[generalStyle, imageStyle]}
        />
        :
        // Placeholder
        <div css={[generalStyle, placeholderStyle]}>
          <span>{t('thumbnail.noThumbnailAvailable')}</span>
        </div>
      }
    </>
  )
}

/**
 * Buttons and actions related to thumbnails for a given track
 */
const ThumbnailButtons : React.FC<{
  track: Track,
  index: number,
  inputRefs: any,
  generate: any,
  upload: any,
  uploadCallback: any,
  discard: any,
}> = ({track, index, inputRefs, generate, upload, uploadCallback, discard}) => {

  const theme = useSelector(selectTheme);
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const tracks = useSelector(selectTracks)

  // Set the given thumbnail for all tracks
  const setForOtherThumbnails = (uri: string | undefined) => {
    if (uri === undefined) {
      return
    }
    const thumbnails = []
    for (const track of tracks) {
      thumbnails.push({id: track.id, uri: uri})
    }
    dispatch(setThumbnails(thumbnails))
    dispatch(setHasChanges(true))
  }

  return (
    <div css={thumbnailButtonsStyle}>
      <div
        css={thumbnailButtonStyle(true, theme)}
        title={t('thumbnail.buttonGenerate-tooltip')}
        role="button" tabIndex={0} aria-label={t('thumbnail.buttonGenerate-tooltip-aria')}
        onClick={() => {
          generate(track, index)
        }}
        onKeyDown={(event: React.KeyboardEvent) => { if (event.key === " " || event.key === "Enter") {
          generate(track, index)
        }}}
      >
        <FontAwesomeIcon icon={faCamera}/>
        {t('thumbnail.buttonGenerate')}
      </div>
      <div
        css={thumbnailButtonStyle(true, theme)}
        title={t('thumbnail.buttonUpload-tooltip')}
        role="button" tabIndex={0} aria-label={t('thumbnail.buttonUpload-tooltip-aria')}
        onClick={() => {
          upload(index)
        }}
        onKeyDown={(event: React.KeyboardEvent) => { if (event.key === " " || event.key === "Enter") {
          upload(index)
        }}}
      >
        <FontAwesomeIcon icon={faUpload}/>
        {t('thumbnail.buttonUpload')}
      </div>
        <input
          style={{display: 'none'}}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="file"
          accept="image/*"
          onChange={(event) => uploadCallback(event, track)}
        />
      <div
        css={thumbnailButtonStyle(track.thumbnailUri? track.thumbnailUri.startsWith("data"): false, theme)}
        title={t('thumbnail.buttonUseForOtherThumbnails-tooltip')}
        role="button" tabIndex={0} aria-label={t('thumbnail.buttonUseForOtherThumbnails-tooltip-aria')}
        onClick={() => {
          setForOtherThumbnails(track.thumbnailUri)
        }}
        onKeyDown={(event: React.KeyboardEvent) => { if (event.key === " " || event.key === "Enter") {
          setForOtherThumbnails(track.thumbnailUri)
        }}}
      >
        <FontAwesomeIcon icon={faCopy}/>
        {t('thumbnail.buttonUseForOtherThumbnails')}
      </div>
      <div
        css={thumbnailButtonStyle(track.thumbnailUri? track.thumbnailUri.startsWith("data"): false, theme)}
        title={t('thumbnail.buttonDiscard-tooltip')}
        role="button" tabIndex={0} aria-label={t('thumbnail.buttonDiscard-tooltip-aria')}
        onClick={() => {
          discard(track.id)
        }}
        onKeyDown={(event: React.KeyboardEvent) => { if (event.key === " " || event.key === "Enter") {
          discard(track.id)
        }}}
      >
        <FontAwesomeIcon icon={faTimesCircle}/>
        {t('thumbnail.buttonDiscard')}
      </div>
    </div>
  )
}

/**
 * Extra header/footer row
 * For e.g. buttons that affect all rows in the table
 */
const AffectAllRow : React.FC<{
  tracks: Track[]
  generate: any
}> = ({generate, tracks}) => {

  const { t } = useTranslation()
  const theme = useSelector(selectTheme);

  const generateAll = () => {
    for (let i = 0; i < tracks.length; i++) {
      generate(tracks[i], i)
    }
  }

  const rowStyle = css({
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '50px',
    padding: '20px',
    gap: '20px',
    justifyContent: 'center',
    alignItems: 'center',
    borderTop: `${theme.menuBorder}`,
  })

  const buttonStyle = css({
    height: '100%',
    minWidth: '200px',
    boxShadow: `${theme.boxShadow}`,
    background: `${theme.element_bg}`,
  })

  return (
    <div css={rowStyle}>
      <FontAwesomeIcon icon={faInfoCircle} size="2x" />
      {t('thumbnail.explanation')}
      <div css={[basicButtonStyle, buttonStyle]}
        title={t('thumbnail.buttonGenerateAll-tooltip')}
        role="button" tabIndex={0} aria-label={t('thumbnail.buttonGenerateAll-tooltip-aria')}
        onClick={() => {
          generateAll()
        }}
        onKeyDown={(event: React.KeyboardEvent) => { if (event.key === " " || event.key === "Enter") {
          generateAll()
        }}}
      >
        <FontAwesomeIcon icon={faCamera}/>
        {t('thumbnail.buttonGenerateAll')}
      </div>
    </div>
  )
}

/**
 * Components for simple mode
 */

/**
 * Main simple mode component. A single table row displaying the interface for
 * the primary thumbnail.
 */
const ThumbnailTableSingleRow: React.FC<{
  track: Track,
  index: number,
  inputRefs: any,
  generate: any,
  upload: any,
  uploadCallback: any,
  discard: any,
}> = ({track, index, inputRefs, generate, upload, uploadCallback, discard}) => {

  return (
    <div key={index} css={thumbnailTableRowStyle}>
      <div css={thumbnailTableRowTitleStyle}>
        {t("thumbnailSimple.rowTitle")}
      </div>
      <hr css={{width: '100%'}}></hr>
      <div css={thumbnailTableRowRowStyle} key={index}>
        <ThumbnailDisplayer track={track} />
        <ThumbnailButtonsSimple
          track={track}
          index={index}
          inputRefs={inputRefs}
          generate={generate}
          upload={upload}
          uploadCallback={uploadCallback}
          discard={discard}/>
      </div>
    </div>
  )
}

/**
 * Buttons for simple mode. Shows a generate button for each video
 */
const ThumbnailButtonsSimple : React.FC<{
  track: Track,
  index: number,
  inputRefs: any,
  generate: any,
  upload: any,
  uploadCallback: any,
  discard: any,
}> = ({track, index, generate, inputRefs, upload, uploadCallback, discard}) => {

  const { t } = useTranslation()
  const theme = useSelector(selectTheme);

  const tracks = useSelector(selectTracks)

  return (
    <div css={thumbnailButtonsStyle}>
      {tracks.map( (generateTrack: Track, generateIndex: number) => (
        <div
          css={thumbnailButtonStyle(true, theme)}
          title={t('thumbnail.buttonGenerate-tooltip')}
          role="button" tabIndex={0} aria-label={t('thumbnail.buttonGenerate-tooltip-aria')}
          onClick={() => {
            generate(track, generateIndex)
          }}
          onKeyDown={(event: React.KeyboardEvent) => { if (event.key === " " || event.key === "Enter") {
            generate(track, generateIndex)
          }}}
        >
          <FontAwesomeIcon icon={faCamera}/>
          {t('thumbnail.buttonGenerate') + " " + t("thumbnailSimple.from") + " " + generateTrack.flavor.type}
        </div>
      ))}
      <div
        css={thumbnailButtonStyle(true, theme)}
        title={t('thumbnail.buttonUpload-tooltip')}
        role="button" tabIndex={0} aria-label={t('thumbnail.buttonUpload-tooltip-aria')}
        onClick={() => {
          upload(index)
        }}
        onKeyDown={(event: React.KeyboardEvent) => { if (event.key === " " || event.key === "Enter") {
          upload(index)
        }}}
      >
        <FontAwesomeIcon icon={faUpload}/>
        {t('thumbnail.buttonUpload')}
      </div>
        <input
          style={{display: 'none'}}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="file"
          accept="image/*"
          onChange={(event) => uploadCallback(event, track)}
        />
      <div
        css={thumbnailButtonStyle(track.thumbnailUri? track.thumbnailUri.startsWith("data"): false, theme)}
        title={t('thumbnail.buttonDiscard-tooltip')}
        role="button" tabIndex={0} aria-label={t('thumbnail.buttonDiscard-tooltip-aria')}
        onClick={() => {
          discard(track.id)
        }}
        onKeyDown={(event: React.KeyboardEvent) => { if (event.key === " " || event.key === "Enter") {
          discard(track.id)
        }}}
      >
        <FontAwesomeIcon icon={faTimesCircle}/>
        {t('thumbnail.buttonDiscard')}
      </div>
    </div>
  )
}

/**
 * CSS shared between multi and simple display mode
 */
const thumbnailTableRowStyle = css({
  display: 'flex',
  flexDirection: 'column',
  padding: '6px 12px',
})

const thumbnailTableRowTitleStyle = css({
  textAlign: 'left',
  textTransform: 'capitalize',
  fontSize: 'larger',
  fontWeight: 'bold',
})

const thumbnailTableRowRowStyle = css({
  display: 'flex',
  flexDirection: 'row',
  ...(flexGapReplacementStyle(20, true)),

  justifyContent: 'space-around',
  flexWrap: 'wrap',
})

const thumbnailButtonsStyle = css({
  // TODO: Avoid hard-coding max-width
  "@media (max-width: 1000px)": {
    flexDirection: 'row',
    width: '100%',
  },
  display: 'flex',
  flexDirection: 'column',
  ...(flexGapReplacementStyle(20, true)),
})

const thumbnailButtonStyle = (active: boolean, theme: Theme) => [
  active ? basicButtonStyle : deactivatedButtonStyle,
  {
    width: '100%',
    height: '100%',
    boxShadow: `${theme.boxShadow}`,
    background: `${theme.element_bg}`,
    justifySelf: 'center',
    alignSelf: 'center',
    padding: '0px 2px'
  }
];


export default Thumbnail;

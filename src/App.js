// import "./App.css";
import React from 'react';
import axios from 'axios';
import styles from './App.module.css';
// import cs from 'classnames';

const ACTIONTERMS = {
    STORY_FETCH_INIT: 'STORY_FETCH_INIT',
    STORY_FETCH_SUCCESS: 'STORY_FETCH_SUCCESS',
    STORY_FETCH_FAILURE: 'STORY_FETCH_FAILURE',
    REMOVE_STORY: 'REMOVE_STORY',
}

const API_ENDPOINT = 'https://hn.algolia.com/api/v1/search?query=';     //url for fetching data


const useSemiPersistentState = (key, initialState) => {
    const [value, setValue] = React.useState(localStorage.getItem(key) || initialState)
    React.useEffect(() => {
        localStorage.setItem(key, value)
    }, [value, key])
    return [value, setValue]
}

const storiesReducer = (state, action) => {
    switch (action.type) {
        case ACTIONTERMS.STORY_FETCH_INIT:
            return {
                ...state,
                isLoading: true,
                isError: false,
            }
        case ACTIONTERMS.STORY_FETCH_SUCCESS:
            return {
                ...state,
                isLoading: false,
                isError: false,
                data: action.payload,
            }
        case ACTIONTERMS.STORY_FETCH_FAILURE:
            return {
                ...state,
                isLoading: false,
                isError: true,
            }
        case ACTIONTERMS.REMOVE_STORY:
            return {
                ...state,
                data: state.data.filter(story => action.payload.objectID !== story.objectID),
            }
        default:
            throw new Error();
    }
}

export default function App() {
    const [searchTerm, setSearchTerm] = useSemiPersistentState('search', 'React')

    const [stories, dispatchStories] = React.useReducer(storiesReducer, { data: [], isLoading: false, isError: false })

    const [url, setUrl] = React.useState(`${API_ENDPOINT}${searchTerm}`)


    const handleFetchStories = React.useCallback(async () => {
        dispatchStories({
            type: ACTIONTERMS.STORY_FETCH_INIT
        })
        const result = await axios.get(url)
        try {
            dispatchStories({
                type: ACTIONTERMS.STORY_FETCH_SUCCESS,
                payload: result.data.hits,
            })
        }
        catch {
            dispatchStories({ type: ACTIONTERMS.STORY_FETCH_FAILURE })
        };
    }, [url])

    React.useEffect(() => {
        // console.log("effect")
        handleFetchStories()
    }, [handleFetchStories])



    const handleRemoveStory = item => {
        dispatchStories({
            type: ACTIONTERMS.REMOVE_STORY,
            payload: item,
        })

    }
    const handleSearchInput = (event) => {
        setSearchTerm(event.target.value)
    }
    const handleSearchSubmit = (event) => {
        setUrl(`${API_ENDPOINT}${searchTerm}`)
        event.preventDefault();                              //prevent from reload after submitting
    }
    return (
        <div className={styles.container}>  
            <h1 className={styles.headlinePrimary}> My hacker Stories</h1>
            <SearchForm searchTerm={searchTerm} onSearchInput={handleSearchInput} onSearchSubmit={handleSearchSubmit}/>

            {stories.isLoading ? (<p>Loading......</p>) : (<List list={stories.data} onRemoveItem={handleRemoveStory} />)}
            {stories.isError && <p> something went wrong.....</p>}

        </div>
    );
}

const SearchForm = ({ searchTerm, onSearchInput, onSearchSubmit }) => (
    <form onSubmit={onSearchSubmit} className={styles.searchForm}>
        <InputWithlabel id="search"
            value={searchTerm}
            isFocused
            onInputChange={onSearchInput}>
            <strong>Search:</strong>

        </InputWithlabel>
        <button type="submit" className={`${styles.button} ${styles.buttonLarge}`   }
            disabled={!searchTerm}
        >
            Submit
        </button>

    </form>
)

const InputWithlabel = ({ id, value, type = "text", isFocused, onInputChange, children }) => {
    const inputRef = React.useRef();
    React.useEffect(()=>{
      if(isFocused){
        inputRef.current.focus()
      }
    },[inputRef])
    return (
        <>
            <label htmlFor={id} className={styles.label}>{children}</label>
            &nbsp;
            <input
                id={id}
                ref={inputRef}
                type={type}
                value={value}
                onChange={onInputChange}
                className={styles.input}
            />
        </>
    )
}

const List = ({ list, onRemoveItem }) =>
    list.map(item => (
        <Item key={item.objectID}
            item={item}
            onRemoveItem={onRemoveItem}
        />
    )
    )


const Item = ({ item, onRemoveItem }) => {
    return (
        <div className={styles.item}>
            <span style={{width:'40%'}}><a href={item.url}> {item.title}</a></span>
            <span style={{width:'30%'}}>     {item.author} </span>
            <span style={{width:'10%'}}>     {item.num_comments} </span>
            <span style={{width:'10%'}}>     {item.points} </span>
            <span style={{width:'10%'}}>     <button type="button" onClick={() => onRemoveItem(item)} className={`${styles.button} ${styles.buttonSmall}`}>Dismiss</button></span>
        </div>
    )
}


import React, { Component } from "react";
import Commenters from "./Commenters.js";

import axios from "axios";
import _ from "lodash";

class App extends Component {
  // STRUCTURE OF STORIES INSIDE STATE:
  // stories [
  //   {
  //     id: 123213,                          // ID of the story
  //     title: "Gears",
  //     score: 2134,
  //     url: "htttp://sdasdasasddc.com",
  //     kids: [2131321,12321323,121233],     // IDs of the comments
  //     topCommenters: [
  //        {
  //          user: "atrv7"
  //          storyCommentCount: 3,
  //          totalCommentCount: 4
  //        },
  //        {
  //          user: "theDude"
  //          storyCommentCount: 2,
  //          totalCommentCount: 6
  //        }
  //     ]
  //   }
  // ]

  state = {
    stories: [],
    loadingStories: true,
    loadingComments: true,
    commentTotals: {}
  };
  
  fetchingStoriesPromises = [];
  fetchingCommentsPromises = [];


  //       commentTotals/commentTotalsTracker: {
  //          "theDude": 4
  //          "atrv7": 2,
  //          ...
  //        }
  commentTotalsTracker = {};

  async fetchTopStories(numberOfStories) {
 
      // Fetch top stories from HackerNews, then iterate through the storyIDs in the response data
      axios.get('https://hacker-news.firebaseio.com/v0/beststories.json?print=pretty&orderBy="$key"&limitToFirst='+numberOfStories)
        .then(hackerTopStoriesResponse => {
           hackerTopStoriesResponse.data.map(storyID => {
              
              // Keep track of async requests which are fetching each story's details
              this.fetchingStoriesPromises.push(
                axios.get("https://hacker-news.firebaseio.com/v0/item/" + storyID + ".json")
                  .then((storyDetailsResponse)=>{
                  
                    // Clean up the story data and update the state without mutating the original objects
                    let story = _.pick(storyDetailsResponse.data,["title", "url", "score", "id", "kids"]);   
                    this.setState(prevState => ({...prevState,stories: [...prevState.stories, story]}));

                    // Fetch comments for each story using commentIDs extracted from the story details response
                    let commentIDs = story.kids;
                    this.getTopCommentersForStory(commentIDs)

                })
              )
           })
           // Once all comments have been fetched, set loadingStories state to false to show stories
           axios.all(this.fetchingStoriesPromises)
            .then(() => {
                this.setState(prevState => ({...prevState, loadingStories:false})); 

                // Once all comments have been fetched, set loadingComments to false to show top commenters
                axios.all(this.fetchingCommentsPromises)
                      .then(() => {                        
                            this.setState(prevState => ({...prevState, loadingComments:false})); 
                      })
                });
      
        
      });
  }

  async getTopCommentersForStory(commentIDs) {
  
    let allCommentersForStory = [];
    let commentedStoryID;
    
    // Fetch each comment using comment ID and wait for all the comments for the story to load before determining top commenters
    axios.all(commentIDs.map(commentID => {
      let commentFetchPromise = axios.get('https://hacker-news.firebaseio.com/v0/item/'+commentID+'.json');
      this.fetchingCommentsPromises.push(commentFetchPromise);
      return commentFetchPromise;
    })).then(axios.spread((...commentResponses)=> {
        
        commentResponses.forEach((commentResponse,index)=>{

          if (
            commentResponse.status === 200 &&
            commentResponse.data &&
            commentResponse.data.by 
          ) {

            let commentDetails = commentResponse.data;
            let username = commentDetails.by;
            commentedStoryID = commentDetails.parent;
            
            //Check if username exists for story
            let commenterExistsAtIndex = allCommentersForStory.findIndex(commenter => (commenter.user === username));

            if(commenterExistsAtIndex>-1){
              allCommentersForStory[commenterExistsAtIndex]["storyCommentCount"] = allCommentersForStory[commenterExistsAtIndex]["storyCommentCount"]+1;
            
            }
            else{
              allCommentersForStory.push({
                 user: username,
                 storyCommentCount: 1      
              });   

            }

            if(this.commentTotalsTracker[username]) this.commentTotalsTracker[username] = this.commentTotalsTracker[username]+1;
            else this.commentTotalsTracker[username]=1;
          }
        });

         // Sort commenters by most posts on story
        allCommentersForStory = _.orderBy(
            allCommentersForStory,
            "storyCommentCount",
            "desc"
        );

        let stateIncludingCommenters = this.state;
        let storyExistsInStateAtIndex = stateIncludingCommenters.stories.findIndex(story => (story.id === commentedStoryID));
     
        stateIncludingCommenters.stories[storyExistsInStateAtIndex]["topCommenters"] = [...allCommentersForStory.slice(0,10)];
        stateIncludingCommenters.commentTotals = {...this.commentTotalsTracker};

        this.setState(stateIncludingCommenters)

      }))
  }
  componentDidMount() {
    this.fetchTopStories(30);
    
  }
  render() {
    const { stories, loadingStories, loadingComments, commentTotals } = this.state;

    return (
      <div className="container">
        <div className="col-xs-12">
          <h1>HackerNews Top Commenters</h1>
          <div className="news-container">
            {loadingStories && <div>LOADING TOP NEWS STORIES</div>}
            {stories.map(story => {
              return (
                <div
                  key={story.id}
                  className="story-container card"
                  onClick={() => window.open(story.url, "_blank")}
                >
                  <div className="story card-body">
                    <h5 className="story-title card-title">{story.title}</h5>
                    <h6 className="story-commment-1 card-subtitle mb-2 text-muted">{story.scorer}</h6>

                    <Commenters topCommenters={story.topCommenters} commentTotals={commentTotals} loading={loadingComments} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}

export default App;

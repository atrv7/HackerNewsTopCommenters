import React, { Component } from 'react';
import PropTypes from 'prop-types'

import './App.css';


const Commenters = (props) => {
  const { topCommenters, loading, commentTotals} = props;
  var commentRank = 0;

  return (
   <div>
    { loading ? (<div>LOADING TOP COMMENTERS</div>) : (<div>TOP COMMENTERS:</div>) }
    { topCommenters &&
        topCommenters.map(topCommenters => {
          commentRank++;

          var commenter = commentRank+" - "+topCommenters.user+" ("+topCommenters.storyCommentCount+" for story)"
          var commmenterWithTotals = commentRank+" - "+topCommenters.user+" ("+topCommenters.storyCommentCount+" for story - "+commentTotals[topCommenters.user]+" total)"

          return(
            <div key={commentRank}>
              { loading ? commenter : commmenterWithTotals}

            </div>
            );
        })
     }
     </div>
  );
}

export default Commenters;

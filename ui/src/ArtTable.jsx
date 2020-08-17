import React from 'react';
import { withRouter } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import {
  Button, Glyphicon, Tooltip, OverlayTrigger, Table,
} from 'react-bootstrap';

import UserContext from './UserContext.js';

// eslint-disable-next-line react/prefer-stateless-function
class ArtRowPlain extends React.Component {
  render() {
    const {
      art, location: { search }, deleteArt, index,
    } = this.props;
    const user = this.context;
    const disabled = !user.signedIn;

    const selectLocation = { pathname: `/info/${art.id}`, search };
    const editTooltip = (
      <Tooltip id="close-tooltip" placement="top">Edit Art</Tooltip>
    );
    
    const deleteTooltip = (
      <Tooltip id="delete-tooltip" placement="top">Delete Art</Tooltip>
    );

    function onDelete(e) {
      e.preventDefault();
      deleteArt(index);
    }

    const tableRow = (
      <tr>
        <td><img src={art.src} height="100" alt="Pic" /></td>
        <td>{art.id}</td>
        <td>{art.artist}</td>
        <td>{art.uploadDate.toDateString()}</td>
        <td>{art.title}</td>
        <td>{art.description}</td>
        <td>
          <LinkContainer to={`/edit/${art.id}`}>
            <OverlayTrigger delayShow={1000} overlay={editTooltip}>
              <Button bsSize="xsmall">
                <Glyphicon glyph="edit" />
              </Button>
            </OverlayTrigger>
          </LinkContainer>
          <OverlayTrigger delayShow={1000} overlay={deleteTooltip}>
            <Button disabled={disabled} bsSize="xsmall" onClick={onDelete}>
              <Glyphicon glyph="trash" />
            </Button>
          </OverlayTrigger>
        </td>
      </tr>
    );

    return (
      <LinkContainer to={selectLocation}>
        {tableRow}
      </LinkContainer>
    );
  }
}

ArtRowPlain.contextType = UserContext;
const ArtRow = withRouter(ArtRowPlain);
delete ArtRow.contextType;

export default function ArtTable({ arts, closeArt, deleteArt }) {
  const artRows = arts.map((art, index) => (
    <ArtRow
      key={art.id}
      art={art}
      closeArt={closeArt}
      deleteArt={deleteArt}
      index={index}
    />
  ));

  return (
    <Table bordered condensed hover responsive>
      <thead>
        <tr>
          <th>Picture</th>
          <th>ID</th>
          <th>Artist</th>
          <th>Upload Date</th>
          <th>Title</th>
          <th>Description</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {artRows}
      </tbody>
    </Table>
  );
}

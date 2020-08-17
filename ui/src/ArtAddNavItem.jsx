import React, { Component } from 'react';
import axios from 'axios';
import { withRouter } from 'react-router-dom';
import {
  NavItem, Glyphicon, Modal, Form, FormGroup, FormControl, ControlLabel,
  Button, ButtonToolbar, Tooltip, OverlayTrigger,
} from 'react-bootstrap';

import graphQLFetch from './graphQLFetch.js';
import withToast from './withToast.jsx';

class ArtAddNavItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showing: false,
      success: false,
      url: '',
      error: false,
      errorMessage: '',
    };

    this.showModal = this.showModal.bind(this);
    this.hideModal = this.hideModal.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange() {
    this.setState({ success: false, url: '' });
  }

  showModal() {
    this.setState({ showing: true });
  }

  hideModal() {
    this.setState({ showing: false });
  }

  handleUpload(e) {
    e.preventDefault();
    const file = this.uploadInput.files[0];

    // Checking that the user uploads a file
    if (file == undefined) {
      const { showError } = this.props;
      showError('Please include an image');
      return;
    } else {
      const { showSuccess } = this.props;
      showSuccess('Loading Image...');
    }


    // Split the filename to get the name and type
    const fileParts = this.uploadInput.files[0].name.split('.');
    const fileName = fileParts[0];
    const fileType = fileParts[1];
    axios.post('http://localhost:3000/sign_s3', {

      fileName,
      fileType,
    })
      .then((response) => {
        const { returnData } = response.data.data;
        const { signedRequest } = returnData;
        const { url } = returnData;
        this.setState({ url });
        const options = {
          headers: {
            'Access-Control-Allow-Origin': process.env.API_PROXY_TARGET,
            'Content-Type': fileType,
          },
        };
        axios.put(signedRequest, file, options)
          .then((result) => {
            this.setState({ success: true });
            this.handleSubmit(e);
          })
          .catch((error) => {
            alert(`ERROR ${JSON.stringify(error)}`);
          });
      })
      .catch((error) => {
        alert(JSON.stringify(error));
      });

  }

  async handleSubmit(e) {

    const { dismissToast } = this.props;
    dismissToast();

    this.hideModal();
    const form = document.forms.artAdd;
    const { user } = this.props;
    const email = user.email;

    const art = {
      artist: form.artist.value,
      title: form.title.value,
      src: this.state.url,
      userEmail: email,
      height: 1,
      width: 1,
      likes: 0,
    };
    const query = `mutation artAdd($art: ArtInputs!) {
      artAdd(art: $art) {
        id
      }
    }`;
    const { showError } = this.props;
    const data = await graphQLFetch(query, { art }, showError);
    if (data) {
      const { history } = this.props;
      history.push(`/edit/${data.artAdd.id}`);
    }
  }

  render() {
    const { showing } = this.state;
    const { user: { signedIn } } = this.props;
    const SuccessMessage = () => (
      <div style={{ padding: 50 }}>
        <h3 style={{ color: 'green' }}>SUCCESSFUL UPLOAD</h3>
        <a href={this.state.url}>Access the file here</a>
        <br />
      </div>
    );
    const ErrorMessage = () => (
      <div style={{ padding: 50 }}>
        <h3 style={{ color: 'red' }}>FAILED UPLOAD</h3>
        <span style={{ color: 'red', backgroundColor: 'black' }}>ERROR: </span>
        <span>{this.state.errorMessage}</span>
        <br />
      </div>
    );
    return (
      <React.Fragment>
        <NavItem disabled={!signedIn} onClick={this.showModal}>
          <OverlayTrigger
            placement="left"
            delayShow={1000}
            overlay={<Tooltip id="create-art">Create Art</Tooltip>}
          >
            <Glyphicon glyph="plus" />
          </OverlayTrigger>
        </NavItem>
        <Modal keyboard show={showing} onHide={this.hideModal}>
          <Modal.Header closeButton>
            <Modal.Title>Create Art</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form name="artAdd">
              <FormGroup>
                <ControlLabel>Title</ControlLabel>
                <FormControl name="title" autoFocus />
              </FormGroup>
              <FormGroup>
                <ControlLabel>Artist</ControlLabel>
                <FormControl name="artist" />
              </FormGroup>
              <FormGroup>
                <ControlLabel>Picture</ControlLabel>
                <input
                  type="file"
                  name="picture"
                  onChange={this.handleChange}
                  ref={(ref) => { this.uploadInput = ref; }}
                />
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <ButtonToolbar>
              <Button
                type="button"
                bsStyle="primary"
                onClick={this.handleUpload}
              >
                Submit
              </Button>
              <Button bsStyle="link" onClick={this.hideModal}>
                Cancel
              </Button>
            </ButtonToolbar>
          </Modal.Footer>
        </Modal>
      </React.Fragment>
    );
  }
}

export default withToast(withRouter(ArtAddNavItem));

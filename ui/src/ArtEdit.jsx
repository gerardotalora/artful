import React from 'react';
import { Link } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import {
  Col, Panel, Form, FormGroup, FormControl, ControlLabel,
  ButtonToolbar, Button, Alert,
} from 'react-bootstrap';
import axios from 'axios';

import graphQLFetch from './graphQLFetch.js';
import NumInput from './NumInput.jsx';
import DateInput from './DateInput.jsx';
import TextInput from './TextInput.jsx';
import withToast from './withToast.jsx';
import store from './store.js';
import UserContext from './UserContext.js';

class ArtEdit extends React.Component {
  static async fetchData(match, search, showError) {
    const query = `query art($id: Int!) {
      art(id: $id) {
        id title status artist
        effort uploadDate year description
        src
      }
    }`;

    const { params: { id } } = match;
    const result = await graphQLFetch(query, { id: parseInt(id, 10) }, showError);
    return result;
  }

  constructor() {
    super();
    const art = store.initialData ? store.initialData.art : null;
    delete store.initialData;
    this.state = {
      art,
      invalidFields: {},
      showingValidation: false,
      success: false,
      error: false,
      url: '',
    };
    this.onChange = this.onChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
    this.imageUpdate = this.imageUpdate.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onValidityChange = this.onValidityChange.bind(this);
    this.dismissValidation = this.dismissValidation.bind(this);
    this.showValidation = this.showValidation.bind(this);
  }

    handleChange(e) {
    this.setState({ success: false, url: "" });
  }

  componentDidMount() {
    const { art } = this.state;
    if (art == null) this.loadData();
  }

  imageUpdate( ) {
    // const { name, value: textValue } = event.target;
    // const value = naturalValue === undefined ? textValue : naturalValue;
    this.setState(prevState => ({
      art: { ...prevState.art, src: this.state.url },
    }));
  }

  componentDidUpdate(prevProps) {
    const { match: { params: { id: prevId } } } = prevProps;
    const { match: { params: { id } } } = this.props;
    if (id !== prevId) {
      this.loadData();
    }
  }

  onChange(event, naturalValue) {
    let { name, value: textValue } = event.target;
    let value = naturalValue === undefined ? textValue : naturalValue;
    this.setState(prevState => ({
      art: { ...prevState.art, [name]: value },
    }));
  }

  onValidityChange(event, valid) {
    const { name } = event.target;
    this.setState((prevState) => {
      const invalidFields = { ...prevState.invalidFields, [name]: !valid };
      if (valid) delete invalidFields[name];
      return { invalidFields };
    });
  }

    handleUpload(e) {
    // e.preventDefault();
    let file = this.uploadInput.files[0];
    let fileParts = this.uploadInput.files[0].name.split('.');
    let fileName = fileParts[0].trim();
    let fileType = fileParts[1].trim();
    axios.post("http://localhost:3000/sign_s3", {
      fileName,
      fileType,
    })
      .then((response) => {
        let { returnData } = response.data.data;
        let { signedRequest } = returnData;
        let { url } = returnData;
        this.setState({ url });
        this.imageUpdate();
        const options = {
          headers: {
            'Access-Control-Allow-Origin': process.env.API_PROXY_TARGET,
            'Content-Type': fileType,
          },
        };
        axios.put(signedRequest, file, options)
          .then((result) => {
            this.setState({ success: true });
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
    e.preventDefault();
    this.showValidation();
    const { art, invalidFields } = this.state;
    if (Object.keys(invalidFields).length !== 0) return;

    const query = `mutation artUpdate(
      $id: Int!
      $changes: ArtUpdateInputs!
    ) {
      artUpdate(
        id: $id
        changes: $changes
      ) {
        id title status artist
        effort uploadDate year description
        src
      }
    }`;

    const { id, uploadDate, ...changes } = art;
    const { showSuccess, showError } = this.props;
    const data = await graphQLFetch(query, { changes, id }, showError);
    if (data) {
      this.setState({ art: data.artUpdate });
      showSuccess('Updated art successfully');
    }
  }

  async loadData() {
    const { match, showError } = this.props;
    const data = await ArtEdit.fetchData(match, null, showError);
    this.setState({ art: data ? data.art : {}, invalidFields: {} });
  }

  showValidation() {
    this.setState({ showingValidation: true });
  }

  dismissValidation() {
    this.setState({ showingValidation: false });
  }

  render() {
    const { art } = this.state;
    if (art == null) return null;
    const { art: { id } } = this.state;
    const { match: { params: { id: propsId } } } = this.props;
    if (id == null) {
      if (propsId != null) {
        return <h3>{`Art work with ID ${propsId} not found.`}</h3>;
      }
      return null;
    }

    const { invalidFields, showingValidation } = this.state;
    let validationMessage;
    if (Object.keys(invalidFields).length !== 0 && showingValidation) {
      validationMessage = (
        <Alert bsStyle="danger" onDismiss={this.dismissValidation}>
          Please correct invalid fields before submitting.
        </Alert>
      );
    }

    const { art: { title, status } } = this.state;
    const { art: { artist, description } } = this.state;
    const { art: { uploadDate, year } } = this.state;
    const { art: { src } } = this.state;

    const user = this.context;

    return (
      <Panel>
        <Panel.Heading>
          <Panel.Title>{`Editing art work: ${id}`}</Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          <Form horizontal onSubmit={this.handleSubmit}>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={3}>Upload Date</Col>
              <Col sm={9}>
                <FormControl.Static>
                  {uploadDate.toDateString()}
                </FormControl.Static>
              </Col>
            </FormGroup>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={3}>Status</Col>
              <Col sm={9}>
                <FormControl
                  componentClass="select"
                  name="status"
                  value={status}
                  onChange={this.onChange}
                >
                  <option value="ForSale">For Sale</option>
                  <option value="NotForSale">Not for Sale</option>
                </FormControl>
              </Col>
            </FormGroup>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={3}>Artist</Col>
              <Col sm={9}>
                <FormControl
                  componentClass={TextInput}
                  name="artist"
                  value={artist}
                  onChange={this.onChange}
                  key={id}
                />
              </Col>
            </FormGroup>
            <FormGroup validationState={
              invalidFields.year ? 'error' : null
            }
            >
              <Col componentClass={ControlLabel} sm={3}>Year</Col>
              <Col sm={9}>
                <FormControl
                  componentClass={DateInput}
                  onValidityChange={this.onValidityChange}
                  name="year"
                  value={year}
                  onChange={this.onChange}
                  key={id}
                />
                <FormControl.Feedback />
              </Col>
            </FormGroup>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={3}>Title</Col>
              <Col sm={9}>
                <FormControl
                  componentClass={TextInput}
                  size={50}
                  name="title"
                  value={title}
                  onChange={this.onChange}
                  key={id}
                />
              </Col>
            </FormGroup>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={3}>Image</Col>
              <Col sm={9}>
                {/* {this.state.success ? <SuccessMessage /> : null}
                {this.state.error ? <ErrorMessage /> : null} */}
                <td><img src={art.src} width='100' height='100' alt="image" /></td>
                <br/>
                <input
                  name="src"
                  onChange={this.handleChange}
                  ref={(ref) => { this.uploadInput = ref; }}
                  type="file"
                />
                <br />
                <Button
                  type="button"
                  bsStyle="primary"
                  onClick={this.handleUpload}
                  >
                  Upload
                </Button>
                </Col>
              </FormGroup>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={3}>Description</Col>
              <Col sm={9}>
                <FormControl
                  componentClass={TextInput}
                  tag="textarea"
                  rows={4}
                  cols={50}
                  name="description"
                  value={description}
                  onChange={this.onChange}
                  key={id}
                />
              </Col>
            </FormGroup>
            <FormGroup>
              <Col smOffset={3} sm={6}>
                <ButtonToolbar>
                <LinkContainer to="/profile">
                  <Button
                    disabled={!user.signedIn}
                    bsStyle="primary"
                    type="submit"
                  >
                    Submit
                  </Button>
                  </LinkContainer>
                  <LinkContainer to="/profile">
                    <Button bsStyle="link">Back</Button>
                  </LinkContainer>
                </ButtonToolbar>
              </Col>
            </FormGroup>
            <FormGroup>
              <Col smOffset={3} sm={9}>{validationMessage}</Col>
            </FormGroup>
          </Form>
        </Panel.Body>
      </Panel>
    );
  }
}

ArtEdit.contextType = UserContext;

const ArtEditWithToast = withToast(ArtEdit);
ArtEditWithToast.fetchData = ArtEdit.fetchData;

export default ArtEditWithToast;

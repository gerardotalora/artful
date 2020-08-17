import React from 'react';
import {
  Form, FormControl, FormGroup, ControlLabel, Button,
} from 'react-bootstrap';

export default class ArtAdd extends React.Component {
  constructor() {
    super();
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();
    const form = document.forms.artAdd;
    const art = {
      artist: form.artist.value,
      title: form.title.value,
      year: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 10),
      source: 'https://source.unsplash.com/user/erondu/100x100',
    };
    const { createArt } = this.props;
    createArt(art);
    form.artist.value = ''; form.title.value = '';
  }

  render() {
    return (
      <Form inline name="artAdd" onSubmit={this.handleSubmit}>
        <FormGroup>
          <ControlLabel>Artist:</ControlLabel>
          {' '}
          <FormControl type="text" name="artist" />
        </FormGroup>
        {' '}
        <FormGroup>
          <ControlLabel>Title:</ControlLabel>
          {' '}
          <FormControl type="text" name="title" />
        </FormGroup>
        {' '}
        <Button bsStyle="primary" type="submit">Add</Button>
      </Form>
    );
  }
}

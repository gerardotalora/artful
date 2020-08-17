import React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import {
    Col, Panel, Form, FormGroup, FormControl, ControlLabel, Button, Glyphicon
} from 'react-bootstrap';

import graphQLFetch from './graphQLFetch.js';
import store from './store.js';
import UserContext from './UserContext.js';

export default class ArtInfo extends React.Component {
    static async fetchData(match, search, showError) {
        const query = `query art($id: Int!) {
            art(id: $id) {
            id title status artist src likes
            effort uploadDate year description
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
        };
        this.setYear = this.setYear.bind(this);
        this.onLike = this.onLike.bind(this);
    }

    componentDidMount() {
        const { art } = this.state;
        if (art == null) this.loadData();
    }

    componentDidUpdate(prevProps) {
        const { match: { params: { id: prevId } } } = prevProps;
        const { match: { params: { id } } } = this.props;
        if (id !== prevId) {
            this.loadData();
        }
    }

    async loadData() {
        const { match, showError } = this.props;
        const data = await ArtInfo.fetchData(match, null, showError);
        this.setState({ art: data ? data.art : {}, invalidFields: {} });
    }

    setYear() {
        const { art: { year }} = this.state;
        if (year == null) {
            return "Unknown";
        } else {
            return year.toDateString();
        }
    }

    async onLike() {
        let newLikes = (this.state.art.likes + 1);
        console.log("New Likes: " + newLikes);
        this.setState({ art: { ...this.state.art, likes: newLikes }});
        console.log("Likes after plus one: " + this.state.art.likes);
        

        const query = `mutation artUpdate(
            $id: Int!
            $changes: ArtUpdateInputs!
        ) {
            artUpdate(
                id: $id
                changes: $changes
            ) {
                id title status artist
                effort year 
                description likes
            }
        }`;

        const { id, ...changes } = this.state.art;
        delete changes.uploadDate;


        console.log("Likes before fetch: " + this.state.art.likes);
        const data = await graphQLFetch(query, { changes, id });
        console.log("Likes after fetch: " + this.state.art.likes);

        if (data) {
            data.artUpdate.likes = this.state.art.likes;
            console.log("Likes before setState: " + this.state.art.likes);
            this.setState({ art: { ...this.state.art, likes: this.state.art.likes}});
            console.log("Likes after setState: " + this.state.art.likes);
        }
        // this.setState({ likes: { likes: data.artUpdate.likes } });
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

        const { art: { title, status } } = this.state;
        const { art: { artist, src, description } } = this.state;
        const { art: { uploadDate, likes } } = this.state;

        const user = this.context;
        const disabled = !user.signedIn;

        return (
            <Panel>
                <Panel.Heading>
                    <Panel.Title>{`${title} by ${artist}`}</Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                    <Form horizontal onSubmit={this.handleSubmit}>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={3}/>
                            <Col sm={9}>
                                <FormControl.Static>
                                    <img src={src} alt={title} height="400" />
                                </FormControl.Static>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={3} />
                            <Col sm={9}>
                                <Button
                                    type="button"
                                    bsStyle="danger"
                                    onClick={this.onLike}
                                    disabled={disabled}
                                >
                                    <Glyphicon glyph="heart" /> {likes}
                                </Button>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={3}>Title</Col>
                            <Col sm={9}>
                                <FormControl.Static>
                                    {title}
                                </FormControl.Static>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={3}>Artist</Col>
                            <Col sm={9}>
                                <FormControl.Static>
                                    {artist}
                                </FormControl.Static>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={3}>Description</Col>
                            <Col sm={9}>
                                <FormControl.Static>
                                    {description}
                                </FormControl.Static>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={3}>Year</Col>
                            <Col sm={9}>
                                <FormControl.Static>
                                    {this.setYear()}
                                </FormControl.Static>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={3}>Status</Col>
                            <Col sm={9}>
                                <FormControl.Static>
                                    {status}
                                </FormControl.Static>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={3}>Upload Date</Col>
                            <Col sm={9}>
                                <FormControl.Static>
                                    {uploadDate.toDateString()}
                                </FormControl.Static>
                            </Col>
                        </FormGroup>
                    </Form>
                </Panel.Body>
            </Panel>
        );
    }
}

ArtInfo.contextType = UserContext;
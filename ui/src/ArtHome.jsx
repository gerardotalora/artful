import React from "react";
import Gallery from "react-photo-gallery";
import store from './store.js';
import graphQLFetch from './graphQLFetch.js';
import Carousel, { Modal, ModalGateway } from "react-images";

export default class ArtHome extends React.Component {
    static async fetchData(match, search, showError) {
        const params = new URLSearchParams(search);
        const vars = { hasSelection: false, selectedId: 0 };

        const { params: { id } } = match;
        const idInt = parseInt(id, 10);
        if (!Number.isNaN(idInt)) {
            vars.hasSelection = true;
            vars.selectedId = idInt;
        }

        let page = parseInt(params.get('page'), 10);
        if (Number.isNaN(page)) page = 1;
        vars.page = page;

        const query = `query artList(
      $status: StatusType
      $effortMin: Int
      $effortMax: Int
      $hasSelection: Boolean!
      $selectedId: Int!
      $page: Int
    ) {
      artList(
        status: $status
        effortMin: $effortMin
        effortMax: $effortMax
        page: $page
      ) {
        arts {
          id title artist
          src height width description
        }
        pages
      }
      art(id: $selectedId) @include (if : $hasSelection) {
        id description
      }
    }`;

        const data = await graphQLFetch(query, vars, showError);
        return data;
    }

    constructor() {
        super();
        const initialData = store.initialData || { artList: {} };
        const {
            artList: { arts, pages }, art: selectedArt,
        } = initialData;
        delete store.initialData;
        this.state = {
            arts,
            selectedArt,
            pages,
            currentImage: 0,
            viewerIsOpen: false,
        };

        this.openLightbox = this.openLightbox.bind(this);
        this.closeLightbox = this.closeLightbox.bind(this);
    }

    componentDidMount() {
        const { arts } = this.state;
        if (arts == null) this.loadData();

        this.setState({ currentImage: 0, viewerIsOpen: false });
    }

    componentDidUpdate(prevProps) {
        const {
            location: { search: prevSearch },
            match: { params: { id: prevId } },
        } = prevProps;
        const { location: { search }, match: { params: { id } } } = this.props;
        if (prevSearch !== search || prevId !== id) {
            this.loadData();
        }
    }

    async loadData() {
        const { location: { search }, match, showError } = this.props;
        const data = await ArtHome.fetchData(match, search, showError);
        if (data) {
            this.setState({
                arts: data.artList.arts,
                selectedArt: data.art,
                pages: data.artList.pages,
            });
        }
    }

    openLightbox(event, { art, index }) {
        this.setState({ currentImage: index, viewerIsOpen: true });
    }

    closeLightbox() {
        this.setState({ currentImage: 0, viewerIsOpen: false });
    }

    render() {
        const { arts } = this.state;
        if (arts == null) return null;

        const { viewerIsOpen } = this.state;
        const { currentImage } = this.state;

        return (
          <div>
            <Gallery photos={arts} onClick={this.openLightbox} />
            <ModalGateway>
              {viewerIsOpen ? (
                <Modal onClose={this.closeLightbox}>
                  <Carousel
                    currentIndex={currentImage}
                    views={arts.map((x) => ({
                      ...x,
                      srcset: x.srcSet,
                      caption: x.title + " by " + x.artist,
                    }))}
                  />
                </Modal>
              ) : null}
            </ModalGateway>
          </div>
        );
    }
}


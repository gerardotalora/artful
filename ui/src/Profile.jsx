import React from 'react';
import URLSearchParams from 'url-search-params';
import { Pagination, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

import ArtTable from './ArtTable.jsx';
import graphQLFetch from './graphQLFetch.js';
import withToast from './withToast.jsx';
import store from './store.js';
import UserContext from './UserContext.js';

const SECTION_SIZE = 5;

function PageLink({
  params, page, activePage, children,
}) {
  params.set('page', page);
  if (page === 0) return React.cloneElement(children, { disabled: true });
  return (
    <LinkContainer
      isActive={() => page === activePage}
      to={{ search: `?${params.toString()}` }}
    >
      {children}
    </LinkContainer>
  );
}

class ArtList extends React.Component {
  static async fetchData(match, search, showError) {
    const params = new URLSearchParams(search);
    const vars = { hasSelection: false, selectedId: 0 };
    if (params.get('status')) vars.status = params.get('status');

    const effortMin = parseInt(params.get('effortMin'), 10);
    if (!Number.isNaN(effortMin)) vars.effortMin = effortMin;
    const effortMax = parseInt(params.get('effortMax'), 10);
    if (!Number.isNaN(effortMax)) vars.effortMax = effortMax;

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
      $userEmail: String
    ) {
      artList(
        status: $status
        effortMin: $effortMin
        effortMax: $effortMax
        page: $page
        userEmail: $userEmail
      ) {
        arts {
          id title status artist
          uploadDate effort year
          src description userEmail
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
      arts: null,
      selectedArt,
      pages,
      userEmail: '',
    };
    this.deleteArt = this.deleteArt.bind(this);
  }

  componentDidMount() {
    const user = this.context;
    while (user === undefined) {
      const user = this.context;
    }
    const userEmail = user.email;
    const { arts } = this.state;
    if (arts === null || this.state.userEmail === '') {
      this.loadData();
    }
  }

  componentDidUpdate(prevProps) {
    const user = this.context;
    while (user === undefined) {
      const user = this.context;
    }
    const userEmail = user.email;
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
    const user = this.context;
    while (user === undefined) {
      const user = this.context;
    }
    const userEmail = user.email;
    const { location: { search }, match, showError } = this.props;
    const data = await ArtList.fetchData(match, search, showError);
    if (data) {
      const arts = data.artList.arts.filter(a => a.userEmail === userEmail);
      this.setState({
        arts: arts,
        selectedArt: data.art,
        pages: data.artList.pages,
        userEmail: userEmail,
      });
    }
  }

  async deleteArt(index) {
    const query = `mutation artDelete($id: Int!) {
      artDelete(id: $id)
    }`;
    const { arts } = this.state;
    const { location: { pathname, search }, history } = this.props;
    const { showSuccess, showError } = this.props;
    const { id } = arts[index];
    const data = await graphQLFetch(query, { id }, showError);
    if (data && data.artDelete) {
      this.setState((prevState) => {
        const newList = [...prevState.arts];
        if (pathname === `/arts/${id}`) {
          history.push({ pathname: '/arts', search });
        }
        newList.splice(index, 1);
        return { arts: newList };
      });
      const undoMessage = (
        <span>
          {`Deleted art work ${id} successfully.`}
          <Button bsStyle="link" onClick={() => this.restoreArt(id)}>
            UNDO
          </Button>
        </span>
      );
      showSuccess(undoMessage);
    } else {
      this.loadData();
    }
  }

  async restoreArt(id) {
    const query = `mutation artRestore($id: Int!) {
      artRestore(id: $id)
    }`;
    const { showSuccess, showError } = this.props;
    const data = await graphQLFetch(query, { id }, showError);
    if (data) {
      showSuccess(`Art work ${id} restored successfully.`);
      this.loadData();
    }
  }

  render() {
    const user = this.context;
    const userEmail = user.email;
    const { arts } = this.state;
    let noArtAlert;
    if (arts == null) return null
    if (arts.length === 0) {
      noArtAlert = 
      <div align="center">
        <h2 >Oh no!</h2>
        <h3>You don't have any art yet, but that's okay</h3>
        <h3>Select the Plus button in the top right to add your masterpiece</h3>
      </div>
    }

    const { selectedArt, pages } = this.state;
    const { location: { search } } = this.props;

    const params = new URLSearchParams(search);
    let page = parseInt(params.get('page'), 10);
    if (Number.isNaN(page)) page = 1;
    const startPage = Math.floor((page - 1) / SECTION_SIZE) * SECTION_SIZE + 1;
    const endPage = startPage + SECTION_SIZE - 1;
    const prevSection = startPage === 1 ? 0 : startPage - SECTION_SIZE;
    const nextSection = endPage >= pages ? 0 : startPage + SECTION_SIZE;

    const items = [];
    for (let i = startPage; i <= Math.min(endPage, pages); i += 1) {
      params.set('page', i);
      items.push((
        <PageLink key={i} params={params} activePage={page} page={i}>
          <Pagination.Item>{i}</Pagination.Item>
        </PageLink>
      ));
    }

    return (
      <React.Fragment> 
        <div>
          <h1>My Art Collection</h1>
          {noArtAlert}
        </div>
        <ArtTable
          arts={arts}
          closeArt={this.closeArt}
          deleteArt={this.deleteArt}
        />
        <Pagination>
          <PageLink params={params} page={prevSection}>
            <Pagination.Item>{"<"}</Pagination.Item>
          </PageLink>
          {items}
          <PageLink params={params} page={nextSection}>
            <Pagination.Item>{">"}</Pagination.Item>
          </PageLink>
        </Pagination>
      </React.Fragment>
    );
  }
}

ArtList.contextType = UserContext;

const ArtListWithToast = withToast(ArtList);
ArtListWithToast.fetchData = ArtList.fetchData;

export default ArtListWithToast;

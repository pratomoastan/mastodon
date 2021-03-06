import React from 'react';
import { connect } from 'react-redux';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';
import { fetchAccount } from '../../actions/accounts';
import { expandAccountMediaTimeline } from '../../actions/timelines';
import LoadingIndicator from '../../components/loading_indicator';
import Column from '../ui/components/column';
import ColumnBackButton from '../../components/column_back_button';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { getAccountGallery } from '../../selectors';
import MediaItem from './components/media_item';
import HeaderContainer from '../account_timeline/containers/header_container';
import { ScrollContainer } from 'react-router-scroll-4';
import LoadMore from '../../components/load_more';

const mapStateToProps = (state, props) => ({
  medias: getAccountGallery(state, props.params.accountId),
  isLoading: state.getIn(['timelines', `account:${props.params.accountId}:media`, 'isLoading']),
  hasMore:   state.getIn(['timelines', `account:${props.params.accountId}:media`, 'hasMore']),
});

class LoadMoreMedia extends ImmutablePureComponent {

  static propTypes = {
    maxId: PropTypes.string,
    onLoadMore: PropTypes.func.isRequired,
  };

  handleLoadMore = () => {
    this.props.onLoadMore(this.props.maxId);
  }

  render () {
    return (
      <LoadMore
        disabled={this.props.disabled}
        onLoadMore={this.handleLoadMore}
      />
    );
  }

}

@connect(mapStateToProps)
export default class AccountGallery extends ImmutablePureComponent {

  static propTypes = {
    params: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    medias: ImmutablePropTypes.list.isRequired,
    isLoading: PropTypes.bool,
    hasMore: PropTypes.bool,
  };

  componentDidMount () {
    this.props.dispatch(fetchAccount(this.props.params.accountId));
    this.props.dispatch(expandAccountMediaTimeline(this.props.params.accountId));
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.params.accountId !== this.props.params.accountId && nextProps.params.accountId) {
      this.props.dispatch(fetchAccount(nextProps.params.accountId));
      this.props.dispatch(expandAccountMediaTimeline(this.props.params.accountId));
    }
  }

  handleScrollToBottom = () => {
    if (this.props.hasMore) {
      this.handleLoadMore(this.props.medias.last().getIn(['status', 'id']));
    }
  }

  handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const offset = scrollHeight - scrollTop - clientHeight;

    if (150 > offset && !this.props.isLoading) {
      this.handleScrollToBottom();
    }
  }

  handleLoadMore = maxId => {
    this.props.dispatch(expandAccountMediaTimeline(this.props.params.accountId, { maxId }));
  };

  handleLoadOlder = (e) => {
    e.preventDefault();
    this.handleScrollToBottom();
  }

  render () {
    const { medias, isLoading, hasMore } = this.props;

    let loadOlder = null;

    if (!medias && isLoading) {
      return (
        <Column>
          <LoadingIndicator />
        </Column>
      );
    }

    if (!isLoading && medias.size > 0 && hasMore) {
      loadOlder = <LoadMore onClick={this.handleLoadOlder} />;
    }

    return (
      <Column>
        <ColumnBackButton />

        <ScrollContainer scrollKey='account_gallery'>
          <div className='scrollable' onScroll={this.handleScroll}>
            <HeaderContainer accountId={this.props.params.accountId} />

            <div className='account-gallery__container'>
              {medias.map((media, index) => media === null ? (
                <LoadMoreMedia
                  key={'more:' + medias.getIn(index + 1, 'id')}
                  maxId={index > 0 ? medias.getIn(index - 1, 'id') : null}
                />
              ) : (
                <MediaItem
                  key={media.get('id')}
                  media={media}
                />
              ))}
              {loadOlder}
            </div>
          </div>
        </ScrollContainer>
      </Column>
    );
  }

}

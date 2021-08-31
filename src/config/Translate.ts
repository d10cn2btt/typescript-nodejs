const TRANSLATE_FROM_JAPANESE_TO_ENGLISH = [
  {
    key: '物件名',
    value: 'name',
    default_value: null,
  },
  {
    key: '賃料',
    value: 'fee',
    default_value: null,
  },
  {
    key: '延床面積',
    value: 'area',
    default_value: null,
  },
  {
    key: '規模',
    value: 'storyAbove',
    default_value: null,
  },
  {
    key: '地下階数',
    value: 'storyBelow',
    default_value: null,
  },
  {
    key: '所在階',
    value: 'locationFloor',
    default_value: null,
  },
  {
    key: '共益費',
    value: 'commonFee',
    default_value: null,
  },
  {
    key: '倉庫設備',
    value: 'equipments',
    default_value: [],
  },
  {
    key: '今すぐ契約可能かどうか',
    value: 'isAvailable',
    default_value: true,
  },
  {
    key: '情報提供元',
    value: 'informationProvider',
    default_value: null,
  },
  {
    key: '倉庫へのアクセス',
    value: 'access',
    default_value: {
      nearestStations: {
        stationName: null,
        transitMinute: null,
        walkingMinute: null,
      },
      nearestInterchanges: {
        highwayName: null,
        interchangeName: null,
        distanceKm: null,
      },
    },
  },
  {
    key: 'ソースパス',
    value: 'sourcePath',
    default_value: null,
  },
  {
    key: '所在地',
    value: 'address',
    default_value: null,
  },
];

export { TRANSLATE_FROM_JAPANESE_TO_ENGLISH };

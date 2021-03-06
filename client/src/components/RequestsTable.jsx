import {useCallback, useEffect, useMemo} from "react"
import {useBlockLayout, useTable} from 'react-table'
import useOracleService from "../services/useOracleService";
import Store from "../state/Store";
import {observer} from "mobx-react-lite"
import {DateTime} from "luxon";
import {FixedSizeList} from "react-window";
import {dateFromIsoToLocal} from '../funcs/funcs'
import reactStringReplace from 'react-string-replace'
import useMongoService from "../services/useMongoService";
import {toJS} from "mobx";
import useUpdateAfterEdit from "../hooks/useUpdateAfterRequstEdit";
import {getClassesForDate} from '../funcs/funcs'


const RequestsTable = observer(() => {
    const {getVehiclesByOraId} = useOracleService()
    const {updateRequest} = useMongoService()
    const {updateAfterRequestEdit} = useUpdateAfterEdit()


    useEffect(async ()=> {
        await updateAfterRequestEdit()
    }, [Store.currentRegionSelected, Store.isShowUnexecuted])


    const data = useMemo(() => Store.requestsData, [Store.requestsData])

    const columns = useMemo(
        () => [
            {
                Header: 'Хозяйство',
                accessor: 'ObjName',
                width: 190
            },
            {
                Header: 'База',
                accessor: 'BaseName',
                width: 130
            },
            {
                Header: 'Техника',
                accessor: 'VehicleType',
                width: 175
            },
            {
                Header: 'Регион',
                accessor: 'Region',
                width: 80
            },
            {
                Header: 'Рег номер',
                accessor: 'VehicleRegNum',
                width: 160,
                Cell: ({value}) => {
                    if (Store.searchInputValue > 2) {
                        value = reactStringReplace(value, Store.searchInputValue, (match, i) => <span key={i} className={'bg-cyan-300'}>{Store.searchInputValue}</span>)
                    }
                    return value
                }
            },
            {
                Header: 'ID',
                accessor: 'VehicleId',
                width: 80
            },
            {
                Header: 'VIN',
                accessor: 'VehicleVin'
            },
            {
                Header: 'Тип заявки',
                accessor: 'RequestType',
                width: 200
            },
            {
                Header: 'Комментарий',
                accessor: 'Description',
                width: 330
            },
            {
                Header: 'Создана',
                accessor: 'CreateDate',
                Cell: ({value}) => value ? dateFromIsoToLocal(value) : null
            },
            {
                Header: 'План',
                accessor: 'PlannedDate',
                Cell: ({value}) => value ? DateTime.fromISO(value).toLocaleString(DateTime.DATE_SHORT) : null,
                width: 90
            },
            {
                Header: 'Закрыта',
                accessor: 'ExecuteDate',
                Cell: ({value}) => value ? dateFromIsoToLocal(value) : null
            },
            {
                Header: 'Создал',
                accessor: 'Creator'
            },
            {
                Header: 'Исполнил',
                accessor: 'Executor',
                width: 130,
                Cell: ({value}) => value && value.length > 1 ? `+ ${value[0]}` : value
            },
            {
                Header: 'Закрыл',
                accessor: 'Auditor'
            },
            {
                Header: 'Прислано',
                accessor: 'SentFromName',
                width: 150
            },
            {
                Header: 'Дата письма',
                accessor: `SentFromDate`,
                Cell: ({value}) => value ? dateFromIsoToLocal(value) : null,
                width: 130
            },
            {
                Header: 'ID заявки',
                accessor: '_id'
            },
            {
                Header: 'ID oracle',
                accessor: 'VehicleOraId'
            },
            {
                Header: 'isExecuted',
                accessor: 'isExecuted'
            },
            {
                Header: 'Acts',
                accessor: 'Acts'
            },
            {
                Header: 'mailId',
                accessor: 'mailId'
            },
            {
                Header: 'mailChangeKey',
                accessor: 'mailChangeKey'
            },
            {
                Header: 'EmailAddress',
                accessor: 'SentFromEmail'
            }
        ],
        []
    )

    const initialState = { hiddenColumns: ['_id', 'VehicleOraId', 'Acts', 'SentFromEmail', 'mailChangeKey', 'mailId', 'CreateDate', 'ExecuteDate', 'Creator', 'Auditor', 'isExecuted', 'VehicleVin'] };

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        totalColumnsWidth,
        prepareRow,
    } = useTable(
        {
            columns,
            data,
            initialState
        },
        useBlockLayout
    )

    const updateBase =  async (base, object, region, vin, regNum, oraId, id) => {
        const body = {base, object, region, vin, regNum, oraId, id}
        await updateRequest(body)
    }

    // Показ полного комментария, имени создателя и проверяющего, даты создания и закрытия
    const showBubble = (e, cell) => {
        Store.setBubbleContextXCoord(e.clientX)
        Store.setBubbleContextYCoord(e.clientY)
        switch (cell.column.id) {
            case 'Description':
                if (e.target.innerText.length > 41) {
                    Store.setBubbleContextText(e.target.innerText);
                    Store.setIsBubbleContextShow(true)
                }
                break
            case 'RequestType':
                if (e.target.innerText.length > 24) {
                    Store.setBubbleContextText(e.target.innerText);
                    Store.setIsBubbleContextShow(true)
                }
                break
            case 'VehicleRegNum':
                if (e.target.innerText.length > 15) {
                    Store.setBubbleContextText(e.target.innerText);
                    Store.setIsBubbleContextShow(true)
                }
                break
            case 'PlannedDate':
                const text1 = cell.row.values.isExecuted ?
                    `Создана:  ${dateFromIsoToLocal(cell.row.values.CreateDate)}\nИсполнена:  ${dateFromIsoToLocal(cell.row.values.ExecuteDate)}` :
                    `Создана:  ${dateFromIsoToLocal(cell.row.values.CreateDate)}`
                Store.setIsBubbleContextShow(true)
                Store.setBubbleContextText(text1)
                break
            case 'Executor':
                const executorText = () => {
                    if (cell.row.values.Executor && cell.row.values.Executor.length > 1) {
                        let text = "Исполнители: "
                        cell.row.values.Executor.forEach(item => {
                            text = `${text}\n\t${item}`
                        })
                        return text
                    }
                    return ''
                }
                const text2 = cell.row.values.Auditor ?
                    `Создал:  ${cell.row.values.Creator}\nЗакрыл:  ${cell.row.values.Auditor}` :
                    `Создал:  ${cell.row.values.Creator}\n${executorText()}`
                Store.setIsBubbleContextShow(true)
                Store.setBubbleContextText(text2)
                break
            case 'ObjName':
                if (e.target.innerText.length > 20) {
                    Store.setBubbleContextText(e.target.innerText);
                    Store.setIsBubbleContextShow(true)
                }
                break
            case 'VehicleType':
                if (e.target.innerText.length > 18) {
                    Store.setBubbleContextText(e.target.innerText);
                    Store.setIsBubbleContextShow(true)
                }
                break
        }
    }

    const hideBubble = () => {
        if  (Store.setIsBubbleContextShow) {
            Store.setBubbleContextText('')
            Store.setIsBubbleContextShow(false)
        }
    }

    const getRowClasses = (currentRequest, row) => {
        let baseClasses = 'text-center break-all line-clamp-1 text-sm cursor-pointer last:rounded-b-xl'
        if (currentRequest && currentRequest._id === row.values._id && Store.showRequestContextMenu) {
            baseClasses = `${baseClasses} bg-amber-300`
        } else if (row.values.ExecuteDate) {
            baseClasses = `${baseClasses} bg-green-300`
        }
        return `${baseClasses} bg-gray-50`

    }

    const onCheckStatus = async (e, rowValues) => {
        e.preventDefault()
        Store.setCurrentRequest(rowValues)
        if (Store.currentRequest.VehicleOraId) {
            Store.setIsCheckStatusModalShow(true)
            Store.setCheckStatusLoading(true)
            try {
                const res = await getVehiclesByOraId(Store.currentRequest.VehicleOraId)
                const vehicle = toJS(Store.currentRequest)
                // Проверяем не изменились ли данные по технике в базе оракл и обновляем
                if (
                    vehicle.VehicleVin !== res[0].ATTR_VALUE ||
                    vehicle.BaseName !== res[0].BASES_NAME ||
                    vehicle.ObjName !== res[0].OBJ_NAME ||
                    vehicle.Region !== res[0].REGION ||
                    vehicle.VehicleRegNum !== res[0].REG_NOM ||
                    vehicle.VehicleId !== res[0].NAV_ID
                ) {
                    await updateBase(res[0].BASES_NAME, res[0].OBJ_NAME, res[0].REGION, res[0].ATTR_VALUE, res[0].REG_NOM, res[0].TRANSP_ID, res[0].NAV_ID)
                    await updateAfterRequestEdit()
                }
                Store.setCheckStatusLoading(false)
                if (res.length === 0) {
                    Store.setShowRequestContextMenu(false);
                    Store.setIsCheckStatusModalShow(false)
                    Store.setNotificationText('Не удалось найти техники с заданным номером')
                    Store.showNotification()
                } else {
                    Store.setFoundVehiclesByRegNom(res)
                    Store.setShowRequestContextMenu(false);
                }
            }
            catch (e) {
                Store.setShowRequestContextMenu(false);
                Store.setNotificationText('База данных не отвечает')
                Store.showNotification()
            }
        }
        else {
            Store.setShowRequestContextMenu(false);
            Store.setNotificationText('Это не техника! ъуъ!')
            Store.showNotification()
        }

    }

    const RenderRow = observer(useCallback(
        ({ index, style }) => {
            const row = rows[index]
            prepareRow(row)
            return (
                <div
                    onDoubleClick={e => onCheckStatus(e, row.values)}
                    onContextMenu={e => onRightClick(e, row.values)}

                     {...row.getRowProps({
                         style,
                         className: getRowClasses(Store.currentRequest, row)
                     })}
                >
                    {row.cells.map((cell, i) => {
                        return (
                            <div
                                key={i}
                                className={getClassesForDate(cell)}
                                {...cell.getCellProps({
                                onMouseEnter : (e) => showBubble(e, cell),
                                onMouseLeave: hideBubble
                            })}>
                                {cell.render('Cell')}
                            </div>
                        )
                    })}
                </div>
            )
        },
        [prepareRow, rows]
    ))


    const onRightClick = async (e, rowValue) => {
        console.log({...Store.currentRequest})
        e.preventDefault()
        await Store.setOffsetY()
        await Store.setCurrentRequest(rowValue)
        await Store.setPosX(e)
        await Store.setPosY(e)
        await Store.setShowRequestContextMenu(true)
    }

    const setSelectedText = () => {
        Store.setSelectedText(window.getSelection().toString())
    }

    return (
        <div
            onMouseUp={setSelectedText}
            className="grow relative request-table overflow-hidden selection:bg-cyan-200 border-collapse mx-auto my-5 border-hidden rounded-l-xl rounded-tr-xl w-[1857px]"
            {...getTableProps()}
        >
            <div className="bg-indigo-200 text-center text-black text-lg py-1">
            {headerGroups.map(headerGroup => (
                    <div {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map(column => (
                                <div className={'py-1'} {...column.getHeaderProps()}>
                                    {column.render('Header')}
                                </div>
                            ))}
                    </div>
                ))}
            </div>
            <div {...getTableBodyProps()}>
                <FixedSizeList
                    height={627}
                    itemCount={rows.length}
                    itemSize={33}
                    width={totalColumnsWidth +12}
                >
                    {RenderRow}
                </FixedSizeList>
            </div>
        </div>
    )
})

export default RequestsTable
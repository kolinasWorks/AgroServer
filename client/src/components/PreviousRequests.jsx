import {useCallback, useMemo} from "react"
import { FixedSizeList} from 'react-window'
import {useTable, useBlockLayout} from "react-table";
import Store from "../state/Store";
import { observer } from "mobx-react-lite"
import {dateFromIsoToLocal} from "../funcs/funcs";

const PreviousRequests = observer(() => {
    const data = useMemo(() => Store.previousRequestsData, [Store.previousRequestsData])
    const columns = useMemo(
        () => [
            {
                Header: 'Дата создания',
                accessor: 'CreateDate',
                Cell: ({value}) => value ? dateFromIsoToLocal(value) : null,
                width: 170
            },
            {
                Header: 'Прислал',
                accessor: 'SentFromName',
                width: 250
            },
            {
                Header: 'Комментарий',
                accessor: 'Description',
                width: 250
            },
            {
                Header: 'Создал',
                accessor: 'Creator',
                width: 120
            },
            {
                Header: 'Исполнил',
                accessor: 'Executor',
                width: 120
            },
            {
                Header: 'Закрыл',
                accessor: 'Auditor',
                width: 120
            },
            {
                Header: 'Закрыта',
                accessor: 'ExecuteDate',
                Cell: ({value}) => value ? dateFromIsoToLocal(value) : null,
                width: 170
            }
        ],
        []
    )

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
            data
        },
        useBlockLayout
    )

    const RenderRow = useCallback(
        ({ index, style }) => {
            const row = rows[index]
            prepareRow(row)
            return (
                <div
                    {...row.getRowProps({
                        style,
                    })}
                    className={'text-center text-md line-clamp-1 hover:bg-cyan-100 bg-white cursor-pointer'}
                >
                    {row.cells.map((cell, i) => {
                        return (

                                <div key={i} {...cell.getCellProps({
                                    onMouseEnter : (e) => {
                                        if (cell.value && (cell.column.id === 'Description' || cell.column.id === 'SentFromName')) {
                                            Store.setBubbleContextXCoord(e.clientX)
                                            Store.setBubbleContextYCoord(e.clientY)
                                            Store.setBubbleContextText(e.target.innerText)
                                            Store.setIsBubbleContextShow(true)
                                        }
                                    },
                                    onMouseLeave: () => {
                                        if  (Store.setIsBubbleContextShow) {
                                            Store.setBubbleContextText('')
                                            Store.setIsBubbleContextShow(false)
                                        }
                                    }

                                })}  className="p-1 line-clamp-1 border">
                                    {cell.render('Cell')}
                                </div>

                        )
                    })}
                </div>
            )
        },
        [prepareRow, rows]
    )


    return (
        <div className={'flex flex-col mt-4'}>
            <h2 className={'text-center text-slate-900 text-xl'}>Прошлые заявки по этой технике</h2>
            <div  className="table-auto mt-2 rounded-t-xl table-fixed position:relative border-collapse mx-auto border-hidden shadow-xl shadow-around bg-gray-100 shadow-md mt-2 shadow-stone-700" {...getTableProps()}>
                <div className="bg-amber-200/80 rounded-t-xl text-center text-slate-900 text-lg py-1">
                    {// Loop over the header rows
                        headerGroups.map((headerGroup, i) => (
                            // Apply the header row propsS
                            <div key={i}  {...headerGroup.getHeaderGroupProps()} >
                                {// Loop over the headers in each row
                                    headerGroup.headers.map((column, i) => (
                                        // Apply the header cell props
                                        <div key={i} {...column.getHeaderProps()}>
                                            {// Render the header
                                                column.render('Header')}
                                        </div>
                                    ))}
                            </div>
                        ))}
                </div>



                <div {...getTableBodyProps()}>
                    <FixedSizeList
                        height={105}
                        itemCount={rows.length}
                        itemSize={35}
                        width={totalColumnsWidth}
                    >
                        {RenderRow}
                    </FixedSizeList>
                </div>

            </div>
        </div>

    )})

export default PreviousRequests;